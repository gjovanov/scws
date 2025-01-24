<template>
  <v-container class="fill-height">
    <v-responsive class="align-center text-center fill-height">
      <h2 v-if="!isStreaming" class="text-h2 font-weight-bold">
        Android Apps Streaming
      </h2>
      <DeviceControls v-if="isStreaming" :sendEvent="send" :fullscreen="fullscreen" :frames-rendered="framesRendered"
        :frames-skipped="framesSkipped" />
      <v-row class="d-flex align-center justify-center">
        <v-col cols="auto">
          <div id="fullscreen" :style="{
            width: '100%',
            height: '100%',
            display: 'flex',
            'flex-direction': 'column',
            background: 'black',
          }" @keydown="handleKeyDown" @keyup="handleKeyUp">
            <div id="video-canvas" :style="{
              transform: `translate(${(rotatedWidth - width) / 2}px, ${(rotatedHeight - height) / 2}px) rotate(${rotation * 90}deg)`,
            }" @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp"
              @pointercancel="handlePointerUp" @pointerleave="handlePointerLeave" @contextmenu="handleContextMenu">
            </div>
          </div>
        </v-col>
      </v-row>
      <DeviceActions @onStart="start" :is-ws-open="isWsOpen" />
      <v-row class="d-flex align-center justify-center pb-4">
        <v-col lg="8" md="12">
          <FileList />
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ScrcpyVideoCodecId,
  ScrcpyAudioCodec,
  AndroidKeyCode,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidMotionEventAction,
  AndroidMotionEventButton,
  ScrcpyPointerId,
  ScrcpyHoverHelper,
  ScrcpyControlMessageType,
} from '@yume-chan/scrcpy'
import { TinyH264Decoder } from '@yume-chan/scrcpy-decoder-tinyh264'
import { WebCodecsVideoDecoder } from '@yume-chan/scrcpy-decoder-webcodecs'
import {
  Float32PcmPlayer,
  Float32PlanerPcmPlayer,
  Int16PcmPlayer,
} from '@yume-chan/pcm-player'
import { ReadableStream, WritableStream } from '@yume-chan/stream-extra'
import {
  AacDecodeStream,
  OpusDecodeStream,
} from '@/utils/audio-decode-stream'
import { Packr, Unpackr } from 'msgpackr'
import { useAdbStore } from '@/store/adb'
import { useFileStore } from '@/store/file'
import { streamingService } from '@/services/stream/streaming-service'
import FileList from '@/components/file/FileList'
import DeviceActions from '@/components/device/DeviceActions'
import DeviceControls from '@/components/device/DeviceControls'
import { mapClientToDevicePosition } from '@/utils/mapClientToDevicePosition'
import {
  PACK_OPTIONS,
  DEAULT_BIT_RATE,
  DEAULT_MAX_FPS,
} from '@/utils/constants'

const MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON = [
  AndroidMotionEventButton.Primary,
  AndroidMotionEventButton.Tertiary,
  AndroidMotionEventButton.Secondary,
  AndroidMotionEventButton.Back,
  AndroidMotionEventButton.Forward,
]
const packer = new Packr(PACK_OPTIONS)
const unpacker = new Unpackr(PACK_OPTIONS)

const adbStore = useAdbStore()
const fileStore = useFileStore()

let container
let fullscreen
let renderer
let audioPlayer
let ws

let abortController
let decoder
let videoController
let audioController
let framesInterval

const hoverHelper = new ScrcpyHoverHelper()
const width = ref(adbStore.displaySize?.width || 0)
const height = ref(adbStore.displaySize?.height || 0)
const rotation = ref(0)

const framesRendered = ref(0)
const framesSkipped = ref(0)

const isStreaming = ref(false)
const isWsOpen = ref(false)
const controlLeft = ref(false)
const controlRight = ref(false)
const shiftLeft = ref(false)
const shiftRight = ref(false)
const altLeft = ref(false)
const altRight = ref(false)
const metaLeft = ref(false)
const metaRight = ref(false)
const capsLock = ref(false)
const numLock = ref(true)
const keys = new Set()

const rotatedWidth = computed(() => {
  return rotation.value & 1 ? height.value : width.value
})
const rotatedHeight = computed(() => {
  return rotation.value & 1 ? width.value : height.value
})

onMounted(async () => {
  container = document.getElementById('video-canvas')
  fullscreen = document.getElementById('fullscreen')

  await Promise.all([
    adbStore.metainfo(),
    fileStore.getUplaods(),
    fileStore.getApps(),
  ])
  await start({ maxFps: DEAULT_MAX_FPS, bitRate: DEAULT_BIT_RATE })
})

const setModifier = (keyCode, value) => {
  switch (keyCode) {
    case AndroidKeyCode.ControlLeft:
      controlLeft.value = value
      break
    case AndroidKeyCode.ControlRight:
      controlRight.value = value
      break
    case AndroidKeyCode.ShiftLeft:
      shiftLeft.value = value
      break
    case AndroidKeyCode.ShiftRight:
      shiftRight.value = value
      break
    case AndroidKeyCode.AltLeft:
      altLeft.value = value
      break
    case AndroidKeyCode.AltRight:
      altRight.value = value
      break
    case AndroidKeyCode.MetaLeft:
      metaLeft.value = value
      break
    case AndroidKeyCode.MetaRight:
      metaRight.value = value
      break
    case AndroidKeyCode.CapsLock:
      if (value) {
        capsLock.value = !capsLock.value
      }
      break
    case AndroidKeyCode.NumLock:
      if (value) {
        numLock.value = !numLock.value
      }
      break
  }
}

const getMetaState = () => {
  let metaState = 0
  if (altLeft.value) {
    metaState |= AndroidKeyEventMeta.AltOn | AndroidKeyEventMeta.AltLeftOn
  }
  if (altRight.value) {
    metaState |= AndroidKeyEventMeta.AltOn | AndroidKeyEventMeta.AltRightOn
  }
  if (shiftLeft.value) {
    metaState |= AndroidKeyEventMeta.ShiftOn | AndroidKeyEventMeta.ShiftLeftOn
  }
  if (shiftRight.value) {
    metaState |=
      AndroidKeyEventMeta.ShiftOn | AndroidKeyEventMeta.ShiftRightOn
  }
  if (controlLeft.value) {
    metaState |= AndroidKeyEventMeta.CtrlOn | AndroidKeyEventMeta.CtrlLeftOn
  }
  if (controlRight.value) {
    metaState |= AndroidKeyEventMeta.CtrlOn | AndroidKeyEventMeta.CtrlRightOn
  }
  if (metaLeft.value) {
    metaState |= AndroidKeyEventMeta.MetaOn | AndroidKeyEventMeta.MetaLeftOn
  }
  if (metaRight.value) {
    metaState |= AndroidKeyEventMeta.MetaOn | AndroidKeyEventMeta.MetaRightOn
  }
  if (capsLock.value) {
    metaState |= AndroidKeyEventMeta.CapsLockOn
  }
  if (numLock.value) {
    metaState |= AndroidKeyEventMeta.NumLockOn
  }
  return metaState
}

const down = async (key) => {
  const keyCode = AndroidKeyCode[key]
  if (!keyCode) {
    console.log('unknown key')
    return
  }

  setModifier(keyCode, true)
  keys.add(keyCode)

  const payload = {
    action: AndroidKeyEventAction.Down,
    keyCode,
    metaState: getMetaState(),
    repeat: 0,
  }
  send({
    cmd: 'injectKeyCode',
    payload,
  })
  // await this.client.controlMessageWriter?.injectKeyCode();
}

const up = async (key) => {
  const keyCode = AndroidKeyCode[key]
  if (!keyCode) {
    return
  }

  setModifier(keyCode, false)
  keys.delete(keyCode)

  send({
    cmd: 'injectKeyCode',
    payload: {
      action: AndroidKeyEventAction.Up,
      keyCode,
      metaState: getMetaState(),
      repeat: 0,
    },
  })
}

const reset = async () => {
  controlLeft.value = false
  controlRight.value = false
  shiftLeft.value = false
  shiftRight.value = false
  altLeft.value = false
  altRight.value = false
  metaLeft.value = false
  metaRight.value = false
  for (const key of keys) {
    up(AndroidKeyCode[key])
  }
  keys.clear()
}

const send = (message) => {
  if (ws) {
    const record = packer.pack(message)
    ws.send(record)
  }
}

const dispose = async () => {
  if (abortController) {
    await abortController.abort()
    console.log('abortController.aborted')
  }
  if (decoder) {
    await decoder.dispose()
    decoder = undefined
    console.log('decoder disposed')
  }
  if (audioPlayer) {
    await audioPlayer.stop()
    audioPlayer = undefined
    console.log('audioPlayer stopped')
  }
  if (ws) {
    await ws.close()
    ws = undefined
    console.log('ws closed')
  }
  if (framesInterval) {
    clearTimeout(framesInterval)
    framesInterval = undefined
  }
  while (container.firstChild) {
    console.log('Removing container.firstChild')
    container.firstChild.remove()
  }
}

const start = async ({ maxFps, bitRate }) => {
  await dispose()

  abortController = new AbortController()
  isStreaming.value = true

  if (['off', 'raw'].includes(adbStore.audioEncoderObj?.codec)) {
    audioPlayer = new Int16PcmPlayer(48000, 2)
  } else if (['aac'].includes(adbStore.audioEncoderObj?.codec)) {
    audioPlayer = new Float32PlanerPcmPlayer(48000, 2)
  } else if (['opus'].includes(adbStore.audioEncoderObj?.codec)) {
    audioPlayer = new Float32PcmPlayer(48000, 2)
  }
  if (['off', 'TinyH264'].includes(adbStore.videoEncoderObj?.decoder)) {
    decoder = new TinyH264Decoder()
  } else if (['WebCodecs'].includes(adbStore.videoEncoderObj?.decoder)) {
    let codec
    switch (adbStore.videoEncoderObj?.codec) {
      case 'h264': {
        codec = ScrcpyVideoCodecId.H264
        break
      }
      case 'h265': {
        codec = ScrcpyVideoCodecId.H265
        break
      }
      case 'av1': {
        codec = ScrcpyVideoCodecId.AV1
        break
      }
    }
    decoder = new WebCodecsVideoDecoder(codec, false) //
  }

  renderer = decoder.renderer
  renderer.style.maxWidth = '100%'
  renderer.style.maxHeight = '100%'
  renderer.style.touchAction = 'none'
  renderer.style.outline = 'none'
  container.appendChild(renderer)
  decoder.sizeChanged((size) => {
    width.value = size.width
    height.value = size.height
    console.log(`RESIZE: width=${size.width}, height=${size.height}`)
  })

  fullscreen.addEventListener('wheel', handleWheel, {
    passive: false,
  })
  fullscreen.tabIndex = 0
  renderer.setAttribute('aria-label', 'Device Screen')

  new ReadableStream({
    start(controller) {
      videoController = controller
    },
  })
    .pipeTo(decoder.writable, {
      signal: abortController.signal,
    })
    .catch((e) => {
      if (abortController.signal.aborted) {
        return
      }
    })
  if (['off', 'raw'].includes(adbStore.audioEncoderObj?.codec)) {
    new ReadableStream({
      start(controller) {
        audioController = controller
      },
    })
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            audioPlayer.feed(
              new Int16Array(
                chunk.data.buffer,
                chunk.data.byteOffset,
                chunk.data.byteLength / Int16Array.BYTES_PER_ELEMENT,
              ),
            )
          },
        }),
      )
      .catch((e) => {
        if (abortController.signal.aborted) {
          return
        }
      })
  } else if (['aac'].includes(adbStore.audioEncoderObj?.codec)) {
    new ReadableStream({
      start(controller) {
        audioController = controller
      },
    })
      .pipeThrough(
        new AacDecodeStream({
          codec: ScrcpyAudioCodec.AAC.webCodecId, //metadata.codec.webCodecId,
          numberOfChannels: 2,
          sampleRate: 48000,
        }),
        {
          signal: abortController.signal,
        },
      )
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            audioPlayer.feed(chunk)
          },
        }),
        {
          signal: abortController.signal,
        },
      )
      .catch((e) => {
        if (abortController.signal.aborted) {
          return
        }
      })
  } else if (['opus'].includes(adbStore.audioEncoderObj?.codec)) {
    new ReadableStream({
      start(controller) {
        audioController = controller
      },
    })
      .pipeThrough(
        new OpusDecodeStream({
          codec: ScrcpyAudioCodec.OPUS.webCodecId, //metadata.codec.webCodecId,
          numberOfChannels: 2,
          sampleRate: 48000,
        }),
        {
          signal: abortController.signal,
        },
      )
      .pipeTo(
        new WritableStream({
          write: (chunk) => {
            audioPlayer.feed(chunk)
          },
        }),
        {
          signal: abortController.signal,
        },
      )
      .catch((e) => {
        if (abortController.signal.aborted) {
          return
        }
      })
  }

  await audioPlayer.start()
  ws = await streamingService.init({
    device: adbStore.device,
    audio: adbStore.audioEncoderObj?.name !== 'off',
    audioCodec:
      adbStore.audioEncoderObj?.codec === 'off'
        ? undefined
        : adbStore.audioEncoderObj?.codec,
    audioEncoder:
      adbStore.audioEncoderObj?.encoder === 'off'
        ? undefined
        : adbStore.audioEncoderObj?.name,

    video: adbStore.videoEncoderObj?.name !== 'off',
    videoCodec:
      adbStore.videoEncoderObj?.codec === 'off'
        ? undefined
        : adbStore.videoEncoderObj?.codec,
    videoEncoder:
      adbStore.videoEncoderObj?.encoder === 'off'
        ? undefined
        : adbStore.videoEncoderObj?.name,

    videoBitRate: bitRate,
    maxFps: maxFps,
    onopen: (ws, id, evt) => {
      console.log(`ID=${id} CONNECTED`)
      isWsOpen.value = true
    },
    onclose: (ws, id, evt) => {
      console.log(`ID=${id} DISCONNECTED`)
      isWsOpen.value = false
      // dispose();
    },
    onmessage: (ws, id, evt) => {
      const record = unpacker.unpack(evt.data)
      if (record.media === 'video') {
        try {
          videoController.enqueue(record.packet)
        } catch (err) {
          console.log(err)
        }
      } else if (record.media === 'audio') {
        try {
          audioController.enqueue(record.packet)
        } catch (err) {
          console.log(err)
        }
      } else if (record.media === 'message') {
        try {
          navigator.clipboard.writeText(record.message)
        } catch (err) {
          console.log(err)
        }
      }
    },
    onerror: (ws, id, evt) => {
      console.log(`ID=${id} ERROR=${evt.data}`)
    },
  })

  framesInterval = setInterval(() => {
    framesRendered.value = decoder.framesRendered
    framesSkipped.value = decoder.framesSkipped
  }, 1000)
}

const handleWheel = (e) => {
  fullscreen.focus()
  e.preventDefault()
  e.stopPropagation()

  const { x, y } = mapClientToDevicePosition({
    clientX: e.clientX,
    clientY: e.clientY,
    clientRect: renderer.getBoundingClientRect(),
    rotation: rotation.value,
    width: width.value,
    height: height.value,
  })

  send({
    cmd: 'injectScroll',
    payload: {
      screenWidth: width.value,
      screenHeight: height.value,
      pointerX: x,
      pointerY: y,
      scrollX: -e.deltaX / 100,
      scrollY: -e.deltaY / 100,
      buttons: 0,
    },
  })
}

const injectTouch = (action, e) => {
  const { pointerType } = e
  let pointerId
  if (pointerType === 'mouse') {
    // Android 13 has bug with mouse injection
    // https://github.com/Genymobile/scrcpy/issues/3708
    pointerId = ScrcpyPointerId.Finger
  } else {
    pointerId = BigInt(e.pointerId)
  }

  const { x, y } = mapClientToDevicePosition({
    clientX: e.clientX,
    clientY: e.clientY,
    clientRect: renderer.getBoundingClientRect(),
    rotation: rotation.value,
    width: width.value,
    height: height.value,
  })

  const messages = hoverHelper.process({
    action,
    pointerId,
    screenWidth: width.value,
    screenHeight: height.value,
    pointerX: x,
    pointerY: y,
    pressure: e.pressure,
    actionButton: MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[e.button],
    // `MouseEvent.buttons` has the same order as Android `MotionEvent`
    buttons: e.buttons,
  })
  for (const message of messages) {
    send({
      cmd: 'injectTouch',
      payload: message,
    })
    // STATE.client.controlMessageWriter!.injectTouch(message);
  }
}

const handleKeyDown = (e) => {
  e.preventDefault()
  e.stopPropagation()
  if (e.ctrlKey && e.key === 'v') {
    handleClipboardPaste(e)
  } else {
    down(e.code)
  }
}

const handleKeyUp = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  up(e.code)
}

const handleClipboardPaste = async (e) => {
  const clipboardText = await navigator.clipboard.readText()
  if (clipboardText)
    send({
      cmd: 'clipboardPaste',
      payload: {
        type: ScrcpyControlMessageType.SetClipboard,
        sequence: BigInt('12345'), // Use BigInt for sequence
        paste: true,
        length: clipboardText.length, // Content length
        content: clipboardText, // Clipboard content
      },
    })
}

const handlePointerDown = (e) => {
  fullscreen.focus()
  e.preventDefault()
  e.stopPropagation()

  e.currentTarget.setPointerCapture(e.pointerId)
  injectTouch(AndroidMotionEventAction.Down, e)
}

const handlePointerMove = (e) => {
  e.preventDefault()
  e.stopPropagation()
  injectTouch(
    e.buttons === 0
      ? AndroidMotionEventAction.HoverMove
      : AndroidMotionEventAction.Move,
    e,
  )
}

const handlePointerUp = (e) => {
  e.preventDefault()
  e.stopPropagation()
  injectTouch(AndroidMotionEventAction.Up, e)
}

const handlePointerLeave = (e) => {
  e.preventDefault()
  e.stopPropagation()
  // Because pointer capture on pointer down, this event only happens for hovering mouse and pen.
  // Release the injected pointer, otherwise it will stuck at the last position.
  injectTouch(AndroidMotionEventAction.HoverExit, e)
  injectTouch(AndroidMotionEventAction.Up, e)
}

const handleContextMenu = (e) => {
  e.preventDefault()
}
</script>
