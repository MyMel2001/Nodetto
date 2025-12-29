import { create } from "zustand"
import { User } from "../components/AccountMenu"
import { error } from "@tauri-apps/plugin-log"

export enum syncStatusEnum {
  synced = "synced",
  syncing = "sincing",
  error = "error",
  offline = "offline"
}

type Store = {
  user: User | null
  allUsers: User[]
  showLogoutConfirm: boolean
  syncStatus: syncStatusEnum

  setUser: (newUser: User | null) => void
  setAllUsers: (newUsers: User[]) => void
  setShowLogoutConfirm: (confirm: boolean) => void
  setSyncStatus: (status: syncStatusEnum) => void
}

export const useGeneral = create<Store>(
  (set) => ({
    user: null,
    allUsers: [],
    showLogoutConfirm: false,
    syncStatus: syncStatusEnum.offline,

    setUser: (newUser) => {
      set(() => ({ user: newUser }))
    },
    setAllUsers: (newUsers) => {
      set(() => ({ allUsers: newUsers }))
    },
    setShowLogoutConfirm: (confirm) => {
      set(() => ({ showLogoutConfirm: confirm }))
    },
    setSyncStatus: (status) => {
      set(() => ({ syncStatus: status }))
    }
  })
)