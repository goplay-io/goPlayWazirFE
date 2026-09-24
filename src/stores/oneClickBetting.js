import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'oneClickBetting'

const DEFAULT_SETTINGS = {
  active: false,
  editMode: false,
  showLoader: false,
  settings_list: [100, 500, 1000, 5000],
  amount: 100
}

export const useOneClickBettingStore = defineStore('oneClickBetting', () => {
  // State
  const active = ref(DEFAULT_SETTINGS.active)
  const editMode = ref(DEFAULT_SETTINGS.editMode)
  const showLoader = ref(DEFAULT_SETTINGS.showLoader)
  const settings_list = ref([...DEFAULT_SETTINGS.settings_list])
  const amount = ref(DEFAULT_SETTINGS.amount)

  // Getters
  const isActive = computed(() => active.value)
  const currentAmount = computed(() => amount.value)
  const amountsList = computed(() => settings_list.value)

  // Load from localStorage on initialization
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        active.value = parsed.active ?? DEFAULT_SETTINGS.active
        editMode.value = false
        showLoader.value = parsed.showLoader ?? DEFAULT_SETTINGS.showLoader
        settings_list.value = parsed.settings_list ?? [...DEFAULT_SETTINGS.settings_list]
        amount.value = parsed.amount ?? DEFAULT_SETTINGS.amount
      }
    } catch (error) {
      console.error('Failed to load one-click betting settings:', error)
    }
  }

  // Save to localStorage
  const saveToStorage = () => {
    try {
      const settings = {
        active: active.value,
        showLoader: showLoader.value,
        settings_list: settings_list.value,
        amount: amount.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save one-click betting settings:', error)
    }
  }

  // Watch for changes and save to localStorage
  watch(
    [active, editMode, showLoader, settings_list, amount],
    () => {
      saveToStorage()
    },
    { deep: true }
  )

  // Actions
  const toggleActive = () => {
    active.value = !active.value
    if (!active.value) {
      editMode.value = false
    }
  }

  const setActive = (value) => {
    active.value = value
  }

  const setAmount = (value) => {
    const numeric = Number(value)
    if (Number.isFinite(numeric) && settings_list.value.includes(numeric)) {
      amount.value = numeric
    }
  }

  const updateSettingsList = (newList) => {
    if (!Array.isArray(newList)) return

    const cleaned = newList
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0)

    const unique = []
    cleaned.forEach(value => {
      if (!unique.includes(value)) unique.push(value)
    })

    if (unique.length === 0) return

    settings_list.value = [...unique]
    // Ensure current amount is still valid
    if (!settings_list.value.includes(amount.value)) {
      amount.value = settings_list.value[0]
    }
  }

  const toggleEditMode = () => {
    editMode.value = !editMode.value
  }

  const setShowLoader = (value) => {
    showLoader.value = value
  }

  const reset = () => {
    active.value = DEFAULT_SETTINGS.active
    editMode.value = DEFAULT_SETTINGS.editMode
    showLoader.value = DEFAULT_SETTINGS.showLoader
    settings_list.value = [...DEFAULT_SETTINGS.settings_list]
    amount.value = DEFAULT_SETTINGS.amount
    saveToStorage()
  }

  // Initialize from localStorage
  loadFromStorage()

  return {
    // State
    active,
    editMode,
    showLoader,
    settings_list,
    amount,

    // Getters
    isActive,
    currentAmount,
    amountsList,

    // Actions
    toggleActive,
    setActive,
    setAmount,
    updateSettingsList,
    toggleEditMode,
    setShowLoader,
    reset,
    loadFromStorage,
    saveToStorage
  }
})
