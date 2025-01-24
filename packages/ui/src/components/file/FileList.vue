<script setup>
  import { ref } from 'vue'
  import { useAdbStore } from '@/store/adb'
  import { useFileStore } from '@/store/file'
  import { useToastStore } from '@/store/toast'
  import { adbService } from '@/services/adb/adb-service'
  import FileUpload from './FileUpload'

  const adbStore = useAdbStore()
  const fileStore = useFileStore()
  const toastStore = useToastStore()
  const panels = ref([])

  async function install(fileName, device, source) {
    const toastTimeout = 5000
    const toast = toastStore.info('Install in progress...', toastTimeout)
    const { data } = await adbService.install({ app: fileName, device, source })
    toastStore.remove(toast)
    if (data.logs?.length) {
      toastStore.success(data.logs, toastTimeout)
    }
    if (data.errors?.length) {
      toastStore.error(data.errors, toastTimeout)
    }
  }

  async function start(fileName, device) {
    const toastTimeout = 5000
    const toast = toastStore.info('Start in progress...', toastTimeout)
    const { data } = await adbService.start({ app: fileName, device })
    toastStore.remove(toast)
    if (data.logs?.length) {
      toastStore.success(data.logs, toastTimeout)
    }
    if (data.errors?.length) {
      toastStore.error(data.errors, toastTimeout)
    }
  }

  async function pin(fileName, device) {
    const toastTimeout = 5000
    const toast = toastStore.info('Pin in progress...', toastTimeout)
    const { data } = await adbService.pin({ app: fileName, device })
    toastStore.remove(toast)
    if (data.logs?.length) {
      toastStore.success(data.logs, toastTimeout)
    }
    if (data.errors?.length) {
      toastStore.error(data.errors, toastTimeout)
    }
  }

  async function unpin(fileName, device) {
    const toastTimeout = 5000
    const toast = toastStore.info('Unpin in progress...', toastTimeout)
    const { data } = await adbService.unpin({ app: fileName, device })
    toastStore.remove(toast)
    if (data.logs?.length) {
      toastStore.success(data.logs, toastTimeout)
    }
    if (data.errors?.length) {
      toastStore.error(data.errors, toastTimeout)
    }
  }
</script>

<template>
  <div>
    <v-expansion-panels v-model="panels" multiple variant="accordion">
      <v-expansion-panel elevation="1" value="apps">
        <v-expansion-panel-title>
          <v-badge :content="fileStore.apps.length">
            <v-icon size="x-large">{{ panels.includes('apps') ? 'mdi-folder-open-outline' : 'mdi-folder-outline'  }}</v-icon>
          </v-badge>&nbsp;<v-chip class="ma-2" label>/apps </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-chip v-if="!fileStore.apps?.length" class="ma-2" color="orange" label>No apps available</v-chip>
          <v-table v-if="fileStore.apps?.length">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, i) in fileStore.apps" :key="i">
                <td class="text-left">{{ file }}</td>
                <td>
                  <v-btn
                    v-tooltip="'Install'"
                    size="small"
                    icon="mdi-cog-sync"
                    variant="text"
                    @click="install(file, adbStore.device, 'apps')"
                  >
                  </v-btn>
                  <v-btn
                    v-tooltip="'Start'"
                    size="small"
                    icon="mdi-play"
                    variant="text"
                    @click="start(file, adbStore.device)"
                  >
                  </v-btn>
                  <v-btn
                    v-tooltip="'Pin'"
                    size="small"
                    icon="mdi-pin"
                    variant="text"
                    @click="pin(file, adbStore.device)"
                  >
                  </v-btn>
                  <v-btn
                    v-tooltip="'Unpin'"
                    size="small"
                    icon="mdi-pin-off"
                    variant="text"
                    @click="unpin(file, adbStore.device)"
                  >
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel elevation="1" value="uploads">
        <v-expansion-panel-title>
          <v-badge :content="fileStore.files.length">
            <v-icon size="x-large">{{ panels.includes('uploads') ? 'mdi-folder-open-outline' : 'mdi-folder-outline'  }}</v-icon>
          </v-badge>&nbsp;<v-chip class="ma-2" label>/uploads </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-chip v-if="!fileStore.files?.length" class="ma-2" color="orange" label>No apps available</v-chip>
          <v-table v-if="fileStore.files?.length">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, i) in fileStore.files" :key="i">
                <td class="text-left">{{ file }}</td>
                <td>
                  <v-btn
                    v-tooltip="'Install'"
                    size="small"
                    icon="mdi-cog-sync"
                    variant="text"
                    @click="install(file, adbStore.device, 'uploads')"
                  >
                  </v-btn>
                  <v-btn
                    v-tooltip="'Start'"
                    size="small"
                    icon="mdi-play"
                    variant="text"
                    @click="start(file, adbStore.device)"
                  >
                  </v-btn>
                  <v-btn
                    v-tooltip="'Pin'"
                    size="small"
                    icon="mdi-pin"
                    variant="text"
                    @click="pin(file, adbStore.device)"
                  >
                  </v-btn>
                  <v-btn
                    v-tooltip="'Unpin'"
                    size="small"
                    icon="mdi-pin-off"
                    variant="text"
                    @click="unpin(file, adbStore.device)"
                  >
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <FileUpload />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
