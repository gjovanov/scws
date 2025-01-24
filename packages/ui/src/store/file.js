import { defineStore } from 'pinia'
import { fileUploadService as service } from '@/services/file/file-service'

export const useFileStore = defineStore('files', {
  state: () => ({ files: [], apps: [] }),
  actions: {
    setFiles(files) {
      this.files = files
    },
    setApps(files) {
      this.apps = files
    },
    async upload(files, params = {}) {
      const result = await service.upload(files, params)
      if (result.data) {
        this.files = result.data
        return result
      }
    },
    async getUplaods(params) {
      const result = await service.getUplaods(params)
      if (result.data) {
        this.files = result.data
      }
    },
    async getApps(params) {
      const result = await service.getApps(params)
      if (result.data) {
        this.apps = result.data
      }
    },
  },
})
