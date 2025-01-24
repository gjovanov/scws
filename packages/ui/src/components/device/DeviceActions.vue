<template>
  <v-row class="d-flex align-center justify-center">
    <v-col cols="auto">
      <v-row class="d-flex pt-4">
        <v-col cols="auto">
          <v-select v-model="adbStore.device" :items="adbStore.devices" label="Device" item-value="serial"
            item-title="serial" required style="max-width: 250px" prepend-inner-icon="mdi-cellphone-link"></v-select>
        </v-col>
        <v-col cols="auto">
          <v-select v-model="adbStore.audioEncoder" :items="adbStore.audioEncoders" item-value="id" :item-title="(item) =>
            `${item.codec}${!['off', 'raw'].includes(item.codec) ? ` - ${item.name}` : ''}`
            " label="Audio" required style="max-width: 250px" prepend-inner-icon="mdi-volume-medium"></v-select>
        </v-col>
        <v-col cols="auto">
          <v-select v-model="adbStore.videoEncoder" :items="adbStore.videoEncoders" item-value="id" :item-title="(item) =>
            `${item.codec}${!['off'].includes(item.codec) ? `- ${item.name} (${item.decoder})` : ''}`
            " label="Video" required style="max-width: 250px" prepend-inner-icon="mdi-video-box"></v-select>
        </v-col>
        <v-col cols="auto">
          <v-number-input v-model="maxFps" label="FPS" :max="90" :min="1" control-variant="stacked"></v-number-input>
        </v-col>
        <v-col cols="auto">
          <v-number-input v-model="bitRate" label="Kbits" :max="16" :min="1" control-variant="stacked"></v-number-input>
        </v-col>
      </v-row>
    </v-col>

    <v-col cols="auto">
      <v-badge :color="isWsOpen ? 'success' : 'error'">
        <v-btn color="primary" min-width="150" rel="noopener noreferrer" size="x-large" variant="flat" @click="start">
          <v-icon icon="mdi-play" size="large" start />
          Start
        </v-btn>
      </v-badge>

    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue'
import { useAdbStore } from '@/store/adb'
import { DEAULT_BIT_RATE, DEAULT_MAX_FPS } from '@/utils/constants'

const props = defineProps(['isWsOpen'])
const emit = defineEmits(['onStart'])

const adbStore = useAdbStore()

const maxFps = ref(DEAULT_MAX_FPS)
const bitRate = ref(DEAULT_BIT_RATE)

const start = async () => {
  emit('onStart', { maxFps: maxFps.value, bitRate: bitRate.value })
}
</script>
