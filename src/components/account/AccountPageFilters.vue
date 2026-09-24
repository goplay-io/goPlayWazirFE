<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toYMDLocal } from '@/utils/dateUtils.js'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  hasValidationError: {
    type: Boolean,
    default: false,
  },
  typeOptions: {
    type: Array,
    default: () => [],
  },
  showTypeFilter: {
    type: Boolean,
    default: true,
  },
  typeLabel: {
    type: String,
    default: '',
  },
  typeItemTitle: {
    type: String,
    default: 'name',
  },
  typeItemValue: {
    type: String,
    default: 'id',
  },
  showDateFilters: {
    type: Boolean,
    default: true,
  },
  typeClearable: {
    type: Boolean,
    default: false,
  },
})

const selectedEventType = defineModel('selectedEventType', { default: null })
const fromDate = defineModel('fromDate', { default: '' })
const toDate = defineModel('toDate', { default: '' })

const emit = defineEmits(['apply', 'date-change', 'type-change'])

const typeFilterLabel = computed(() => props.typeLabel || t('account.statement.selectGamesLabel'))

const filtersClass = computed(() => ({
  'account-page-filters--dates-only': !props.showTypeFilter && props.showDateFilters,
  'account-page-filters--type-only': props.showTypeFilter && !props.showDateFilters,
}))

const { t } = useI18n()

const showFromDateMenu = ref(false)
const showToDateMenu = ref(false)

function formatFilterDateDisplay(ymd) {
  if (!ymd) return ''
  const parts = String(ymd).split('-')
  if (parts.length !== 3) return ymd
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

const displayFromDate = computed(() => formatFilterDateDisplay(fromDate.value))
const displayToDate = computed(() => formatFilterDateDisplay(toDate.value))

function closeDateMenus() {
  showFromDateMenu.value = false
  showToDateMenu.value = false
}

function handleFromDatePicked(value) {
  closeDateMenus()
  fromDate.value = toYMDLocal(value)
  emit('date-change')
}

function handleToDatePicked(value) {
  closeDateMenus()
  toDate.value = toYMDLocal(value)
  emit('date-change')
}
</script>

<template>
  <section class="account-page-filters" :class="filtersClass">
    <div class="account-page-filters__row">
      <div v-if="showTypeFilter" class="account-page-filter-field">
        <span class="account-page-filter-field__label">{{ typeFilterLabel }}</span>
        <v-select
          v-model="selectedEventType"
          :items="typeOptions"
          :item-title="typeItemTitle"
          :item-value="typeItemValue"
          :clearable="typeClearable"
          variant="plain"
          density="compact"
          hide-details
          class="account-page-games-select"
          @update:model-value="emit('type-change')"
        />
      </div>

      <div v-if="showDateFilters" class="account-page-filters__dates">
        <div class="account-page-filter-field">
          <span class="account-page-filter-field__label">{{ t('account.statement.fromLabel') }}</span>
          <v-menu v-model="showFromDateMenu" :close-on-content-click="false" min-width="auto">
            <template #activator="{ props: menuProps }">
              <button type="button" class="account-page-filter-field__control" v-bind="menuProps">
                <span>{{ displayFromDate }}</span>
                <v-icon size="16">mdi-calendar</v-icon>
              </button>
            </template>
            <v-date-picker v-model="fromDate" color="primary" @update:model-value="handleFromDatePicked" />
          </v-menu>
        </div>

        <div class="account-page-filter-field">
          <span class="account-page-filter-field__label">{{ t('common.toDate') }}</span>
          <v-menu v-model="showToDateMenu" :close-on-content-click="false" min-width="auto">
            <template #activator="{ props: menuProps }">
              <button type="button" class="account-page-filter-field__control" v-bind="menuProps">
                <span>{{ displayToDate }}</span>
                <v-icon size="16">mdi-calendar</v-icon>
              </button>
            </template>
            <v-date-picker v-model="toDate" color="primary" @update:model-value="handleToDatePicked" />
          </v-menu>
        </div>
      </div>

      <button
        type="button"
        class="account-page-apply-btn"
        :disabled="hasValidationError"
        @click="emit('apply')"
      >
        <v-progress-circular v-if="loading" indeterminate size="16" width="2" color="#ffffff" />
        <span v-else>{{ t('common.submit') }}</span>
      </button>
    </div>
  </section>
</template>
