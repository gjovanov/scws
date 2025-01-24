<template>
  <v-app-bar
    id="app-bar"
    class="d-flex justify-space-between mb-6"
    height="48"
    color="grey"
  >
    <v-app-bar-nav-icon
      v-if="appStore.isAuth"
      @click="appStore.toggleLeftDrawer()"
    ></v-app-bar-nav-icon>

    <v-app-bar-title>
      <RouterLink
        :to="{ name: 'home' }"
        style="color: white; text-decoration: none"
      >
        <v-avatar size="32">
          <v-img
            v-if="appStore.theme === 'light'"
            height="25"
            src="/src/assets/logo.svg"
          />
          <v-img
            v-if="appStore.theme === 'dark'"
            height="25"
            src="/src/assets/logo-dark.svg"
          />
        </v-avatar>
        <strong> ScrCpy via WebSockets</strong>
      </RouterLink>
    </v-app-bar-title>
    <v-btn
      v-if="appStore.isAuth"
      icon="mdi-menu"
      @click="appStore.toggleRightDrawer()"
    ></v-btn>
  </v-app-bar>
</template>

<script setup>
  import { useAppStore } from '@/store/app'

  const appStore = useAppStore()
</script>
