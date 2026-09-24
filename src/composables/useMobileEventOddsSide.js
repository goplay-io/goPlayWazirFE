import { ref, computed } from 'vue'

/** Per-sport mobile event list odds column: 'back' | 'lay' (shared across rows in that sport). */
const oddsSideBySport = ref({})

export function useMobileEventOddsSide() {
  function getSportKey(event) {
    return String(event?.event_type_id ?? event?.sport_id ?? 'unknown')
  }

  function getOddsSide(sportKey) {
    return oddsSideBySport.value[sportKey] ?? 'back'
  }

  function setOddsSide(sportKey, side) {
    if (side !== 'back' && side !== 'lay') return
    oddsSideBySport.value = { ...oddsSideBySport.value, [sportKey]: side }
  }

  const sides = computed(() => oddsSideBySport.value)

  return {
    sides,
    getSportKey,
    getOddsSide,
    setOddsSide,
  }
}
