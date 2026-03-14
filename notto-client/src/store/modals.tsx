import { create } from "zustand"

export type ConflictNote = {
  id: string
  title: string
  content: string
  updated_at: number
  deleted: boolean
}

type ModalsStore = {
  showLogoutWorkspaceConfirm: boolean
  showDeleteNoteConfirm: boolean
  noteIdToDelete: string | null
  conflictNote: ConflictNote | null

  setShowLogoutWorkspaceConfirm: (show: boolean) => void
  setShowDeleteNoteConfirm: (show: boolean, noteId?: string) => void
  setConflictNote: (note: ConflictNote | null) => void
}

export const useModals = create<ModalsStore>((set) => ({
  showLogoutWorkspaceConfirm: false,
  showDeleteNoteConfirm: false,
  noteIdToDelete: null,
  conflictNote: null,

  setShowLogoutWorkspaceConfirm: (show) => {
    set(() => ({ showLogoutWorkspaceConfirm: show }))
  },
  setShowDeleteNoteConfirm: (show, noteId) => {
    set(() => ({ showDeleteNoteConfirm: show, noteIdToDelete: noteId ?? null }))
  },
  setConflictNote: (note) => {
    set(() => ({ conflictNote: note }))
  },
}))
