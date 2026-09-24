import { ref } from 'vue'

const showExposureDialog = ref(false)

export function useExposureDialog() {
  function openExposureDialog() {
    showExposureDialog.value = true
  }

  function closeExposureDialog() {
    showExposureDialog.value = false
  }

  return {
    showExposureDialog,
    openExposureDialog,
    closeExposureDialog,
  }
}
