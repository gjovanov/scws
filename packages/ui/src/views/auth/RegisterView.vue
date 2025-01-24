<template>
  <v-sheet>
    <v-card class="mx-auto mt-16" max-width="500" elevation="6">
      <v-card-title class="text-h6 font-weight-regular justify-space-between">
        {{ currentStep.title }}
      </v-card-title>
      <v-card-text>
        <v-form :ref="wizardSteps[0].form">
          <v-text-field
            v-model="displayName"
            :counter="20"
            label="Full name"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            required
            class="py-1"
          />

          <v-text-field
            v-model="username"
            :counter="20"
            :rules="usernameRules"
            label="Username"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            required
            class="py-1"
          />

          <v-text-field
            v-model="email"
            :counter="10"
            :rules="emailRules"
            label="Email"
            prepend-inner-icon="mdi-at"
            variant="outlined"
            required
            class="py-1"
          />

          <v-text-field
            v-model="password"
            :counter="10"
            :rules="passwordRules"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPassword = !showPassword"
            autocomplete="on"
            :hint="'Password limit'"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            required
            class="py-1"
          />

          <v-text-field
            v-model="passwordConfirm"
            :counter="10"
            :rules="[...passwordConfirmRules, passwordConfirmationRule]"
            label="Password confirm"
            :type="showPasswordConfirm ? 'text' : 'password'"
            :append-inner-icon="showPasswordConfirm ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
            autocomplete="on"
            :hint="'Password limit'"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            required
            class="py-1"
          />
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="register()">
          Register
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-sheet>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storage } from '@/services/storage'
import { accessToken } from '@/utils/constants'
import { rules } from '@/utils/rules'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useToastStore } from '@/store/toast.js'
import { userService } from '@/services/auth/user-service'

const router = useRouter()
const appStore = useAppStore()
const toastStore = useToastStore()

// WIZARD
const wizardSteps = [
  {
    step: 1,
    title: 'Admin Account',
    form: ref(),
  },
]
const step = ref(1)
const currentStep = computed(() => {
  return wizardSteps.find((s) => s.step === step.value)
})

// Step 1:
const displayName = ref('')
const username = ref('')
const usernameRules = ref(rules.name('Username'))

const email = ref('')
const emailRules = ref(rules.email)

const password = ref('')
const showPassword = ref(false)
const passwordRules = ref(rules.password)

const passwordConfirm = ref('')
const showPasswordConfirm = ref(false)
const passwordConfirmRules = ref(rules.password)
const passwordConfirmationRule = computed(() => {
  return () =>
    password.value === passwordConfirm.value || "Passwords don't match"
})

async function next() {
  const { valid } = await currentStep.value.form.value.validate()

  if (valid) {
    step.value++
  }
}

async function register() {
  try {
    const { valid } = await currentStep.value.form.value.validate()

    if (valid) {
      const {
        data: { user, token, devices, orgs },
      } = await userService.register({
        username: username.value,
        display_name: displayName.value,
        email: email.value,
        password: password.value,
      })
      appStore.setAuth(user, token, devices, orgs)
      storage.setLocal(accessToken, token)

      await router.push({
        name: 'orgs',
      })
    }
  } catch (e) {
    toastStore.error(e.response.data.message)
    console.log('Register Error:', e)
  }
}

onMounted(() => {
  appStore.toggleLeftDrawer(false)
})
</script>
