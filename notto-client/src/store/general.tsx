import { create } from "zustand"
import { User } from "../components/AccountMenu"

type Store = {
  user: User | null
  allUsers: User[]

  setUser: (newUser: User | null) => void
  setAllUsers: (newUsers: User[]) => void
}

export const useGeneral = create<Store>(
  (set) => ({
    user: null,
    allUsers: [],

    setUser: (newUser) => {
      set(() => ({ user: newUser }))
    },
    setAllUsers: (newUsers) => {
      set(() => ({ allUsers: newUsers }))
    }
  })
)