import { create } from 'zustand'
import type { Toast, ToastLevel } from '../types'

interface NotificationStore {
  toasts: Toast[]
  push: (message: string, level?: ToastLevel) => void
  dismiss: (id: string) => void
}

let _seq = 0

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],

  push: (message, level = 'info') => {
    const id = `toast-${++_seq}`
    set((s) => ({ toasts: [...s.toasts, { id, message, level }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
