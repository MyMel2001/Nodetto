import { create } from "zustand"

type ModalsStore = {
  showLogoutWorkspaceConfirm: boolean
  showDeleteNoteConfirm: boolean
  noteIdToDelete: string | null

  setShowLogoutWorkspaceConfirm: (show: boolean) => void
  setShowDeleteNoteConfirm: (show: boolean, noteId?: string) => void
}

export const useModals = create<ModalsStore>((set) => ({
  showLogoutWorkspaceConfirm: false,
  showDeleteNoteConfirm: false,
  noteIdToDelete: null,

  setShowLogoutWorkspaceConfirm: (show) => {
    set(() => ({ showLogoutWorkspaceConfirm: show }))
  },
  setShowDeleteNoteConfirm: (show, noteId) => {
    set(() => ({ showDeleteNoteConfirm: show, noteIdToDelete: noteId ?? null }))
  },
}))
