<template>
  <v-card class="mx-auto mt-16" max-width="500" elevation="6">
    <v-card-title> Login </v-card-title>
    <v-card-text>
      <v-form>
        <v-text-field v-model="usernameOrEmail" label="Username or Email" prepend-inner-icon="mdi-account"
          variant="outlined" required class="py-1" />
        <v-text-field v-model="password" label="Password" :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword" autocomplete="on" :hint="'Password limit'"
          prepend-inner-icon="mdi-lock" variant="outlined" required class="py-1" />
      </v-form>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" variant="flat" :disabled="!canLogin" @click="login()">
        Login
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storage } from '@/services/storage'
import { useAppStore } from '@/store/app'
import { useRouter } from 'vue-router'
import { accessToken } from '@/utils/constants'
import { useToastStore } from '@/store/toast.js'
import { userService } from '@/services/auth/user-service'

const router = useRouter()
const appStore = useAppStore()
const toastStore = useToastStore()

const usernameOrEmail = ref('')
const password = ref('')
const showPassword = ref(false)
const canLogin = computed(() => {
  return usernameOrEmail.value.trim() !== '' && password.value.trim() !== ''
})

const datacenter = import.meta.env.VITE_DATACENTER
const login = async () => {
  try {
    const result = await userService.login({
      username: usernameOrEmail.value,
      password: password.value,
    })
    const user = result.data.user
    const token = result.data.token
    const devices = result.data.devices
    const orgs = result.data.orgs || []
    appStore.setAuth(user, token, devices, orgs)
    storage.setLocal(accessToken, token)

    if (devices && devices.length === 1) {
      const device = devices[0]
      location.href = `https://${datacenter ? `${datacenter}-` : ''}${device.org.orgname}-${user.username}-${device.devicename}.roomler.live/#!action=stream&udid=emulator-5554&player=tinyh264&ws=wss%3A%2F%2F${device.org.orgname}-${user.username}-${device.devicename}.roomler.live%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3Demulator-5554`
    } else {
      await router.push({
        name: '@.user',
        params: { username: appStore.auth.user.username },
      })
    }
  } catch (e) {
    toastStore.error('Invalid username or password.')
    console.log('Login Error:', e)
  }
}

onMounted(() => {
  appStore.toggleLeftDrawer(false)
})
</script>
