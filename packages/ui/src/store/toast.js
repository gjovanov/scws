import { defineStore } from 'pinia'

export const ToastType = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

const DEFAULT_DURATION_SECONDS = 5000
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again latter'

export const useToastStore = defineStore('toast', {
  state: () => ({ toasts: [] }),
  actions: {
    add({ message, type = ToastType.info, timeout }) {
      const toast = {
        _id: Date.now(),
        active: true,
        type,
        messages: [message],
        timeout,
      }
      this.toasts.push(toast)
      return toast
    },
    update(id, message) {
      const index = this.toasts.findIndex((t) => t._id === id)
      if (index >= 0) {
        const toast = this.toasts[index]
        toast.messages.push(message)

        this.toasts.splice(index, 1, toast)
      }
    },
    success(message, durationSeconds = DEFAULT_DURATION_SECONDS) {
      return this.add({
        message,
        type: ToastType.success,
        timeout: durationSeconds,
      })
    },
    info(message, durationSeconds = DEFAULT_DURATION_SECONDS) {
      return this.add({
        message,
        type: ToastType.info,
        timeout: durationSeconds,
      })
    },
    warning(message, durationSeconds = DEFAULT_DURATION_SECONDS) {
      return this.add({
        message,
        type: ToastType.warning,
        timeout: durationSeconds,
      })
    },
    error(
      message = DEFAULT_ERROR_MESSAGE,
      durationSeconds = DEFAULT_DURATION_SECONDS,
    ) {
      return this.add({
        message,
        type: ToastType.error,
        timeout: durationSeconds,
      })
    },
    remove(toast) {
      const index = this.toasts.indexOf(toast)
      if (index > -1) {
        this.toasts.splice(this.toasts.indexOf(toast), 1)
      }
    },
  },
})
