<template>
  <router-view />
</template>

<script setup>
  import { storage } from '@/services/storage'
  import { useAppStore } from '@/store/app'
  import { useAdbStore } from '@/store/adb'
  import { useFileStore } from '@/store/file'

  const appStore = useAppStore()
  const adbStore = useAdbStore()
  const fileStore = useFileStore()
  const token = storage.getLocal('')

  if (token) {
    appStore.setAuth(null, token)
  }
  const run = async () => {
    await Promise.all([
      adbStore.metainfo(),
      fileStore.getUplaods(),
      fileStore.getApps(),
    ])
  }

  // run()
</script>

<style>
  html,
  body {
    touch-action: manipulation;
  }
</style>
