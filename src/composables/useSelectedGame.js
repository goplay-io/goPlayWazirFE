import { ref } from 'vue'

// Store the currently selected game temporarily
const selectedGame = ref(null)

export function useSelectedGame() {
  const setSelectedGame = (game) => {
    selectedGame.value = game
  }

  const getSelectedGame = () => {
    return selectedGame.value
  }

  const clearSelectedGame = () => {
    selectedGame.value = null
  }

  return {
    selectedGame,
    setSelectedGame,
    getSelectedGame,
    clearSelectedGame
  }
}
