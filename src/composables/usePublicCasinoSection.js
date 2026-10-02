import { computed, onMounted, ref } from 'vue';
import { pickSectionItems } from '@/utils/sectionItems';
import { loadCasinoSectionItems } from '@/utils/publicInfoCache';

export function usePublicCasinoSection(sectionCode, staticFallback = []) {
  const loading = ref(true);
  const cmsItems = ref([]);

  const items = computed(() => pickSectionItems(cmsItems.value, staticFallback));

  onMounted(async () => {
    if (!sectionCode) {
      loading.value = false;
      return;
    }
    try {
      cmsItems.value = await loadCasinoSectionItems(sectionCode);
    } catch (error) {
      console.warn(`Failed to load casino section "${sectionCode}":`, error);
      cmsItems.value = [];
    } finally {
      loading.value = false;
    }
  });

  return { loading, items, cmsItems };
}
