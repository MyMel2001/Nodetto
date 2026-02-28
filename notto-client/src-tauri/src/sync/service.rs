use chrono::{DateTime, Utc};
use serde::Serialize;
use shared::{SelectNoteParams, SentNotes};
use tokio::{sync::Mutex, time::Duration};

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::log::{debug, error, trace, warn};

use crate::{AppState, commands, db::{self, schema::{Note, Workspace}}, sync};

#[derive(Clone, Serialize)]
pub enum SyncStatus {
    Synched,
    Syncing,
    Error(String),
    Offline,
    NotConnected
}

pub async fn run(handle: AppHandle) {
    let state = handle.state::<Mutex<AppState>>();
    // last_seen tracks the highest updated_at we have received from the server.
    // We use this instead of Local::now() to avoid clock skew:
    // if the mobile clock is even 1s ahead of the computer's, notes written by
    // the computer would have updated_at < mobile_now and never be fetched.
    let mut last_seen: i64 = DateTime::<Utc>::MIN_UTC.timestamp();

    loop {
        'sync: {
            // Clone the workspace data we need, then release the lock BEFORE any network I/O.
            // Holding the mutex during HTTP calls blocks all commands (create_note, get_note, etc.)
            // which is especially harmful on mobile where the thread pool is limited.
            let workspace = {
                let state = state.lock().await;
                state.workspace.clone()
            };

            if let Some(workspace) = workspace {
                if workspace.id.is_some() && workspace.token.is_some() && workspace.instance.is_some() {
                    trace!("sync last_seen: {last_seen}");

                    match receive_latest_notes(&state, workspace.clone(), last_seen, &handle).await {
                        Ok(max_ts) => {
                            // Advance last_seen to the highest updated_at we received.
                            // Using the server-side timestamps (set by the writing device) keeps
                            // us in one clock domain and eliminates mobile/desktop clock drift.
                            if let Some(ts) = max_ts {
                                last_seen = ts;
                            }
                        },
                        Err(e) => {
                            if let Some(e) = e.downcast_ref::<reqwest::Error>() {
                                if e.is_connect() {
                                    handle.emit("sync-status", SyncStatus::Offline).unwrap();
                                    warn!("Couldn't connect to server");
                                    break 'sync;
                                } else {
                                    handle.emit("sync-status", SyncStatus::Error(e.to_string())).unwrap();
                                    error!("{e}");
                                    break 'sync;
                                }
                            } else {
                                handle.emit("sync-status", SyncStatus::Error(e.to_string())).unwrap();
                                error!("{e}");
                                break 'sync;
                            }
                        }
                    };

                    match send_latest_notes(&state, workspace, &handle).await {
                        Ok(_) => {},
                        Err(e) => {
                            if let Some(e) = e.downcast_ref::<reqwest::Error>() {
                                if e.is_connect() {
                                    handle.emit("sync-status", SyncStatus::Offline).unwrap();
                                    warn!("Couldn't connect to server");
                                    break 'sync;
                                } else {
                                    handle.emit("sync-status", SyncStatus::Error(e.to_string())).unwrap();
                                    error!("{e}");
                                    break 'sync;
                                }
                            } else {
                                handle.emit("sync-status", SyncStatus::Error(e.to_string())).unwrap();
                                error!("{e}");
                                break 'sync;
                            }
                        }
                    };

                    handle.emit("sync-status", SyncStatus::Synched).unwrap();
                } else {
                    handle.emit("sync-status", SyncStatus::NotConnected).unwrap();
                    last_seen = DateTime::<Utc>::MIN_UTC.timestamp();
                }
            }
        }

        // Use async sleep so the tokio runtime thread is NOT blocked between iterations.
        // std::thread::sleep would stall the entire async runtime on mobile where the thread
        // pool is limited, preventing events and commands from being processed.
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}


/// Returns the max `updated_at` timestamp among received notes, or None if the server had nothing new.
/// The caller uses this as the next sync baseline instead of Local::now() to avoid clock skew.
pub async fn receive_latest_notes(
    state: &Mutex<AppState>,
    workspace: Workspace,
    last_seen: i64,
    handle: &AppHandle,
) -> Result<Option<i64>, Box<dyn std::error::Error>> {
    let params = SelectNoteParams {
        username: workspace.username.clone().unwrap(),
        token: hex::encode(workspace.token.clone().unwrap()),
        updated_at: last_seen,
    };

    // HTTP request happens WITHOUT holding the AppState mutex
    let notes = sync::operations::select_notes(params, workspace.instance.clone().unwrap()).await?;

    if notes.is_empty() {
        return Ok(None);
    }

    let max_updated_at = notes.iter().map(|n| n.updated_at).max();

    // Re-acquire the lock only for DB writes
    let state = state.lock().await;
    let conn = state.database.lock().await;

    notes.into_iter().for_each(|note| {
        debug!("note received: {}, {}", note.title, note.updated_at);

        let mut note = db::schema::Note::from(note);
        note.id_workspace = workspace.id;

        let selected_note = db::schema::Note::select(&conn, note.uuid.clone()).unwrap();

        match selected_note {
            Some(sn) => {
                if note.updated_at > sn.updated_at {
                    match sn.synched {
                        true => note.update(&conn).unwrap(),
                        false => error!("Note {:?} is in conflict and it's not handled :(", sn.uuid) //TODO
                    };
                }
            },
            None => note.insert(&conn).unwrap()
        }
    });

    let all_notes = db::operations::get_notes(&conn, workspace.id.unwrap()).unwrap();
    let notes_metadata: Vec<commands::NoteMetadata> = all_notes.into_iter().map(commands::NoteMetadata::from).collect();

    handle.emit("new_note_metadata", &notes_metadata).unwrap();

    Ok(max_updated_at)
}

pub async fn send_latest_notes(
    state: &Mutex<AppState>,
    workspace: Workspace,
    handle: &AppHandle,
) -> Result<(), Box<dyn std::error::Error>> {
    // Collect unsynced notes while holding the lock, then release before HTTP
    let (unsynced_notes, username, token, instance) = {
        let state = state.lock().await;
        let conn = state.database.lock().await;

        let all_notes = Note::select_all(&conn, workspace.id.unwrap()).unwrap();
        let unsynced: Vec<Note> = all_notes.into_iter().filter(|n| !n.synched).collect();

        (
            unsynced,
            workspace.username.clone().unwrap(),
            workspace.token.clone().unwrap(),
            workspace.instance.clone().unwrap(),
        )
    };

    if !unsynced_notes.is_empty() {
        debug!("sending modified notes...");

        handle.emit("sync-status", SyncStatus::Syncing).unwrap();

        let sent_notes = SentNotes {
            username,
            notes: unsynced_notes.into_iter().map(|n| n.into()).collect(),
            token,
        };

        // HTTP request happens WITHOUT holding the AppState mutex
        let results = sync::operations::send_notes(sent_notes, instance).await?;

        // Re-acquire lock only for DB writes
        let state = state.lock().await;
        let conn = state.database.lock().await;

        results.into_iter().for_each(|result| {
            match result.status {
                shared::NoteStatus::Ok => {
                    let mut note = Note::select(&conn, result.uuid).unwrap().unwrap();
                    note.synched = true;
                    note.update(&conn).unwrap();
                },
                shared::NoteStatus::Conflict => {
                    error!("Note {:?} is in conflict and it's not handled :(", result.uuid)
                }
            }
        });
    }

    Ok(())
}
