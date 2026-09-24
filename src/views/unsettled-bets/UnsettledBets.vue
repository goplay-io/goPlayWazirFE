<template>
  <div class="account-page">
    <AccountPageHeader :title="t('unsettledBets.title')" />

    <UnsettledBetsTable
      :bets="bets"
      :loading="loading"
      :total-items="totalItems"
      :page="currentPage"
      :items-per-page="itemsPerPage"
      @update:options="handleTableOptions"
    />
  </div>
</template>

<script setup>
import UnsettledBetsTable from './UnsettledBetsTable.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import { useI18n } from 'vue-i18n'
import * as reports from '@/api/report/reports.js'
import { ref } from 'vue'

const loading = ref(true)
const { t } = useI18n()
const bets = ref([])
const totalItems = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(50)

const fetchUnsettledBets = async (page = currentPage.value, limit = itemsPerPage.value) => {
  loading.value = true
  try {
    const response = await reports.getUnsettledBets({ page, limit })
    if (response?.success) {
      const payload = response.data
      if (payload?.meta?.pagination) {
        bets.value = Array.isArray(payload.data) ? payload.data : []
        totalItems.value = payload.meta.pagination.total_count ?? 0
      } else if (Array.isArray(payload)) {
        bets.value = payload
        totalItems.value = payload.length
      } else {
        bets.value = []
        totalItems.value = 0
      }
    } else {
      bets.value = []
      totalItems.value = 0
    }
  } catch (error) {
    console.error('Failed to fetch unsettled bets:', error)
    bets.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

const handleTableOptions = (options) => {
  currentPage.value = options.page
  itemsPerPage.value = options.itemsPerPage
  fetchUnsettledBets(options.page, options.itemsPerPage)
}
</script>
