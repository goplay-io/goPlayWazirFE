import { ref } from 'vue'

const showBonusRulesModal = ref(false)

export function useBonusRulesModal() {
  function openBonusRulesModal() {
    showBonusRulesModal.value = true
  }

  function closeBonusRulesModal() {
    showBonusRulesModal.value = false
  }

  return {
    showBonusRulesModal,
    openBonusRulesModal,
    closeBonusRulesModal,
  }
}
