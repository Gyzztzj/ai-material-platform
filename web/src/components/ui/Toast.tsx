import { useEffect } from 'react'
import { create } from 'zustand'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  isVisible: false,
  showToast: (message, type = 'info') =>
    set({ message, type, isVisible: true }),
  hideToast: () => set({ isVisible: false }),
}))

export function Toast() {
  const { message, type, isVisible, hideToast } = useToastStore()

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(hideToast, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, hideToast])

  if (!isVisible) return null

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`}
    >
      {message}
    </div>
  )
}

export const toast = (
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
) => {
  useToastStore.getState().showToast(message, type)
}
