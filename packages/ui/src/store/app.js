// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: 'dark',
    leftDrawer: false,
    rightDrawer: false,
    auth: {
      user: null,
      token: null,
      devices: [],
      orgs: [],
    },
    nav: [
      {
        name: 'Orgs',
        icon: 'mdi-home-group',
        to: 'orgs',
      },
      {
        name: 'Users',
        icon: 'mdi-account-group',
        to: 'users',
      },
      {
        name: 'Devices',
        icon: 'mdi-tablet-cellphone',
        to: 'devices',
      },
    ],
    navOpened: [],
  }),
  actions: {
    openLeftDrawer() {
      this.leftDrawer = false
    },
    toggleLeftDrawer(val = null) {
      this.leftDrawer = val === null ? !this.leftDrawer : val
    },
    toggleRightDrawer(val = null) {
      this.rightDrawer = val === null ? !this.rightDrawer : val
    },
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
    setAuth(user, token, devices, orgs) {
      this.auth.user = user
      this.auth.token = token
      this.auth.devices = devices
      this.auth.orgs = orgs
    },
    logout() {
      this.auth.user = null
      this.auth.token = null
      this.auth.devices = []
      this.auth.orgs = []
    },
    resetNav() {
      this.navOpened = []
    },
  },
  getters: {
    isAuth(state) {
      return state.auth.user !== null
    },
    isDark(state) {},
    initials(state) {
      return `${state.auth?.user?.username.substring(
        0,
        1,
      )}${state.auth?.user?.username.substring(1, 2)}`.toUpperCase()
    },
    devicesActive(store) {
      return store.auth.devices?.filter((d) => !!d.org && !!d.owner) || []
    },
  },
})
