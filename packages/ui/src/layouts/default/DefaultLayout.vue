<script setup>
  import { watch } from 'vue'
  import DefaultView from './DefaultView.vue'
  import TopNav from '@/components/nav/TopNav.vue'
  import BaseToast from '@/components/base/BaseToast'

  import { useAppStore } from '@/store/app'

  const appStore = useAppStore()

  watch(
    () => appStore.leftDrawer,
    (val) => {
      if (val) {
        appStore.resetNav()
      }
    },
  )
  watch(
    () => appStore.rightDrawer,
    (val) => {
      if (val) {
        appStore.toggleLeftDrawer(true)
      }
    },
  )
</script>

<template>
  <v-theme-provider :theme="appStore.theme" with-background>
    <v-app id="v-app">
      <v-layout class="rounded rounded-md">
        <!-- TOP NAVIGATION (HEADER) -->
        <TopNav />

        <!-- MAIN PAGE -->
        <default-view />
      </v-layout>
      <BaseToast />
    </v-app>
  </v-theme-provider>
</template>
