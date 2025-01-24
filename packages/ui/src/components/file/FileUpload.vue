<script setup>
  import { ref } from 'vue'
  import { useFileStore } from '@/store/file'
  import { getFileSizeInMb } from '@/utils/file'
  import { FILE_EXTENSIONS } from '@/utils/constants'
  import { useProgressStore } from '@/store/progress'

  const progressStore = useProgressStore()
  const fileStore = useFileStore()
  const files = ref([])
  const fileInput = ref('')
  const filesToUpload = ref([])
  const largeFiles = ref([])
  const isUploading = ref(false)
  const supportedExtensions = FILE_EXTENSIONS.map((ext) => `.${ext}`).toString()

  function prepareFiles(event) {
    if (event.target.files && event.target.files.length > 0) {
      // biome-ignore lint/complexity/noForEach: <explanation>
      Array.from(event.target.files).forEach((file) => {
        const fileSize = getFileSizeInMb(file)
        if (fileSize > 4096) largeFiles.value.push(file)
        filesToUpload.value.push(file)
      })
    }
  }

  function isLargeFile({ name }) {
    return largeFiles.value.some((file) => file.name === name)
  }

  function removeFile(index) {
    files.value.splice(index, 1)
    filesToUpload.value.splice(index, 1)
  }

  function onCancel() {
    files.value = []
    filesToUpload.value = []
    largeFiles.value = []
  }

  async function onUpload() {
    if (filesToUpload.value.length > 0) {
      try {
        isUploading.value = true
        await fileStore.upload(filesToUpload.value)
        await fileStore.getUplaods()
        onCancel()
        isUploading.value = false
      } catch (e) {
        isUploading.value = false
      }
    }
  }
</script>

<template>
  <div class="pt-10">
    <v-row v-if="filesToUpload.length > 0" class="d-flex">
      <v-col cols="12">
        <v-divider />
        <div class="mt-3">
          <strong class="text-secondary">APK files to upload:</strong>
        </div>
      </v-col>
      <template v-if="!isUploading">
        <v-col cols="12">
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Size</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody class="text-left">
              <tr v-for="(file, i) in filesToUpload" :key="i">
                <td>{{ file.name }}</td>
                <td>{{ `${getFileSizeInMb(file)} MB` }}</td>
                <td>
                  <v-btn
                    size="small"
                    color="red"
                    icon="mdi-close"
                    variant="text"
                    @click="removeFile(file)"
                  >
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
        <v-col cols="12">
          <v-btn @click="onCancel" class="mr-3"> Cancel </v-btn>
          <v-btn
            :disabled="largeFiles.length > 0"
            @click="onUpload"
            color="primary"
          >
            Upload
          </v-btn>
        </v-col>
      </template>
      <v-col cols="12 py-5">
        <v-progress-linear
          v-if="isUploading"
          v-model="progressStore.progress"
          :height="4"
          color="secondary"
        />
      </v-col>
    </v-row>
    <form id="file-form">
      <label for="file-upload" class="drop-container">
        <v-file-input
          v-model="files"
          chips
          counter
          multiple
          ref="fileInput"
          label="Select your files"
          variant="outlined"
          placeholder="Select your files"
          :clearable="false"
          :accept="supportedExtensions"
          @change="prepareFiles"
        ></v-file-input>
      </label>
    </form>
  </div>
</template>
