import { create } from 'zustand'

interface LoginModalState {
  isOpen: boolean
  redirectTo: string | null
  open: (redirectTo?: string) => void
  close: () => void
}

export const useLoginModalStore = create<LoginModalState>((set) => ({
  isOpen: false,
  redirectTo: null,
  open: (redirectTo?: string) => set({ isOpen: true, redirectTo: redirectTo || '/admin' }),
  close: () => set({ isOpen: false, redirectTo: null }),
}))
