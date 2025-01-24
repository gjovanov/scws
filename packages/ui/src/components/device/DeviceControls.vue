<template>
  <v-row class="d-flex align-center justify-center">
    <v-col cols="auto">
      <v-btn v-tooltip="'Volume up'" @click="volumeDown">
        <v-icon>mdi-volume-minus</v-icon>
      </v-btn>
      <v-btn v-tooltip="'Volume down'" @click="volumeUp">
        <v-icon>mdi-volume-plus</v-icon>
      </v-btn>
      <v-btn v-tooltip="'Rotate'" @click="rotateDevice">
        <v-icon>mdi-phone-rotate-landscape</v-icon>
      </v-btn>
      <v-btn v-tooltip="'Fullscreen'" @click="enterFullscreen">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <!-- <v-btn @click="rotateVideoLeft">
              <v-icon>mdi-rotate-left-variant</v-icon>
            </v-btn>
            <v-btn @click="rotateVideoRight">
              <v-icon>mdi-rotate-right-variant</v-icon>
            </v-btn>
            <v-btn @click="screenOff">
              <v-icon>mdi-monitor-off</v-icon>
            </v-btn>
            <v-btn @click="screenOn">
              <v-icon>mdi-monitor</v-icon>
            </v-btn> -->
    </v-col>
    <v-col cols="auto">
      <v-chip color="green">{{ framesRendered }}</v-chip>
      <v-chip color="red">{{ framesSkipped }}</v-chip>
    </v-col>
  </v-row>
</template>

<script setup>
import { AndroidKeyCode, AndroidKeyEventAction } from '@yume-chan/scrcpy'
import { useAdbStore } from '@/store/adb'

const adbStore = useAdbStore()

const props = defineProps([
  'sendEvent',
  'fullscreen',
  'framesRendered',
  'framesSkipped'
])

const volumeUp = () => {
  props.sendEvent({
    cmd: 'injectKeyCode',
    payload: {
      action: AndroidKeyEventAction.Down,
      keyCode: AndroidKeyCode.VolumeUp,
      repeat: 0,
      metaState: 0,
    },
  })
  props.sendEvent({
    cmd: 'injectKeyCode',
    payload: {
      action: AndroidKeyEventAction.Up,
      keyCode: AndroidKeyCode.VolumeUp,
      repeat: 0,
      metaState: 0,
    },
  })
}

const volumeDown = () => {
  props.sendEvent({
    cmd: 'injectKeyCode',
    payload: {
      action: AndroidKeyEventAction.Down,
      keyCode: AndroidKeyCode.VolumeDown,
      repeat: 0,
      metaState: 0,
    },
  })
  props.sendEvent({
    cmd: 'injectKeyCode',
    payload: {
      action: AndroidKeyEventAction.Up,
      keyCode: AndroidKeyCode.VolumeDown,
      repeat: 0,
      metaState: 0,
    },
  })
}

const enterFullscreen = () => {
  fullscreen.focus()
  fullscreen.requestFullscreen()
}

const rotateDevice = () => {
  props.sendEvent({
    cmd: 'rotateDevice',
  })
}

const rebootDevice = () => {
  props.sendEvent({
    cmd: 'rebootDevice',
  })
}

const rotateVideoLeft = () => {
  fullscreen.focus()

  rotation.value -= 1
  if (rotation.value < 0) {
    rotation.value = 3
  }
}

const rotateVideoRight = () => {
  fullscreen.focus()
  rotation.value = (rotation.value + 1) & 3
}

const screenOff = () => {
  sendEvent({
    cmd: 'setScreenPowerMode',
    payload: AndroidScreenPowerMode.Off,
  })
}

const screenOn = () => {
  sendEvent({
    cmd: 'setScreenPowerMode',
    payload: AndroidScreenPowerMode.Normal,
  })
}
</script>
