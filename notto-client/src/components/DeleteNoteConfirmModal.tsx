import { invoke } from "@tauri-apps/api/core";
import { useGeneral } from "../store/general";
import { useModals } from "../store/modals";
import { trace } from "@tauri-apps/plugin-log";

export default function DeleteNoteConfirmModal() {
  const { notes, setNotes } = useGeneral();
  const { showDeleteNoteConfirm, noteIdToDelete, setShowDeleteNoteConfirm } = useModals();

  async function handleDelete() {
    if (!noteIdToDelete) return;

    trace("deleting note: " + noteIdToDelete);
    await invoke("delete_note", { id: noteIdToDelete }).catch((e) => console.error(e));

    setNotes(notes.filter((n) => n.id !== noteIdToDelete));
    setShowDeleteNoteConfirm(false);
  }

  return (
    <>
      {showDeleteNoteConfirm &&

        <div className="min-h-screen min-w-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center justify-center p-4 fixed z-50">
          <div className="fixed inset-0 backdrop-blur-sm"
            onClick={() => setShowDeleteNoteConfirm(false)}
          />

          <div className="relative bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Delete Note
              </h2>
              <p className="text-white">
                This note will be deleted.
              </p>
            </div>

            <button
              onClick={handleDelete}
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors mb-3"
            >
              Delete
            </button>

            <button
              onClick={() => setShowDeleteNoteConfirm(false)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      }
    </>
  )
}
