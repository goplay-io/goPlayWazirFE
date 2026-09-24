import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useScorecardTvStore = defineStore('scorecardTv', () => {
  /** Mobile score/TV tab panel — open by default (same as desktop scoreCardVisible). */
  const panelVisible = ref(true);
  /** Active tab inside the panel: 'score' | 'tv'. */
  const activeTab = ref('score');

  const scorePanelVisible = computed(
    () => panelVisible.value && activeTab.value === 'score',
  );
  const tvPanelVisible = computed(
    () => panelVisible.value && activeTab.value === 'tv',
  );

  /** @deprecated use activeTab */
  const mode = computed(() => activeTab.value);

  const setTab = (tab) => {
    if (tab === 'score' || tab === 'tv') activeTab.value = tab;
  };

  const openPanel = (tab = 'score') => {
    setTab(tab);
    panelVisible.value = true;
  };

  const closePanel = () => {
    panelVisible.value = false;
  };

  /** Toggle panel; optional tab selects which tab to show when opening. */
  const togglePanel = (tab = 'score') => {
    if (panelVisible.value && activeTab.value === tab) {
      panelVisible.value = false;
      return;
    }
    openPanel(tab);
  };

  const toggleScorePanel = () => togglePanel('score');
  const toggleTvPanel = () => togglePanel('tv');

  const setMode = (value) => {
    if (value === 'score' || value === 'tv') openPanel(value);
  };

  const toggleMode = () => {
    togglePanel(activeTab.value === 'score' ? 'tv' : 'score');
  };

  const reset = () => {
    // Keep open on event change — same default as desktop scoreCardVisible = true
    panelVisible.value = true;
    activeTab.value = 'score';
  };

  return {
    panelVisible,
    activeTab,
    mode,
    scorePanelVisible,
    tvPanelVisible,
    setTab,
    openPanel,
    closePanel,
    togglePanel,
    setMode,
    toggleMode,
    toggleScorePanel,
    toggleTvPanel,
    reset,
  };
});
