<template>
  <div v-for="toast in toastStore.toasts" :key="toast._id">
    <v-snackbar
      v-model="toast.active"
      :timeout="toast.timeout"
      :color="toast.type"
      vertical
    >
      <p
        v-for="(message, index) in toast.messages"
        :key="index"
        class="text-white"
      >
        {{ message }}
      </p>
      <template v-slot:actions>
        <v-btn variant="text" color="white" @click="toastStore.remove(toast)">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup>
import { useToastStore } from '@/store/toast.js'

const props = defineProps({
  timeout: { type: Number, default: 30000 },
  messages: { type: Array, default: [] },
})
const toastStore = useToastStore()
</script>
<style lang="css" scoped>
.text-white {
  color: white;
}
</style>