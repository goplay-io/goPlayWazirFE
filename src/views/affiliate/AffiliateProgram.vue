<template>
  <div class="account-page affiliate-program">
    <AccountPageHeader :title="t('affiliateProgram.title')">
      <template v-if="activeTab === 'campaigns'" #actions>
        <v-btn
          variant="flat"
          size="small"
          class="affiliate-btn-primary affiliate-btn-primary--header"
          @click="showCreateDialog = true"
        >
          <v-icon size="16" class="tw-mr-1">mdi-plus</v-icon>
          {{ t('affiliateProgram.actions.createCampaign') }}
        </v-btn>
      </template>
    </AccountPageHeader>

    <div class="affiliate-program__body">
      <!-- KPI cards -->
      <div class="affiliate-kpis tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3 tw-mb-4">
        <div class="affiliate-kpi-card">
          <div class="affiliate-kpi-label">{{ t('affiliateProgram.cards.commission.label') }}</div>
          <div class="affiliate-kpi-split">
            <div>
              <div class="affiliate-kpi-note">{{ t('affiliateProgram.cards.commission.available') }}</div>
              <div class="affiliate-kpi-value">{{ formatCurrency(fundsSummary.available) }}</div>
            </div>
            <div class="affiliate-kpi-divider"></div>
            <div>
              <div class="affiliate-kpi-note">{{ t('affiliateProgram.cards.commission.total') }}</div>
              <div class="affiliate-kpi-value">{{ formatCurrency(fundsSummary.total_commission) }}</div>
            </div>
          </div>
        </div>
        <div class="affiliate-kpi-card">
          <div class="affiliate-kpi-label">{{ t('affiliateProgram.cards.activity.label') }}</div>
          <div class="affiliate-kpi-split">
            <div>
              <div class="affiliate-kpi-note">{{ t('affiliateProgram.cards.activity.lifetimeFtdAmount') }}</div>
              <div class="affiliate-kpi-value">{{ formatCurrency(totalFtdAmount) }}</div>
            </div>
            <div class="affiliate-kpi-divider"></div>
            <div>
              <div class="affiliate-kpi-note">{{ t('affiliateProgram.cards.activity.lifetimeFirstDeposits') }}</div>
              <div class="affiliate-kpi-value">{{ totalFirstDeposits }}</div>
            </div>
          </div>
        </div>
        <div class="affiliate-kpi-card">
          <div class="affiliate-kpi-label">{{ t('affiliateProgram.cards.signUps.label') }}</div>
          <div class="affiliate-kpi-note">{{ t('affiliateProgram.cards.signUps.lifetimeSignups') }}</div>
          <div class="affiliate-kpi-value">{{ totalSignups }}</div>
        </div>
      </div>

      <!-- Tabs row -->
      <div class="tw-mb-0">
        <div class="affiliate-tabs tw-flex tw-items-center">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="affiliate-tab-btn"
            :class="{
              'tab-btn--active': activeTab === tab.key
            }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="affiliate-main-panel tw-p-4 lg:tw-p-5">
        <!-- ── CAMPAIGNS TAB ── -->
        <div v-if="activeTab === 'campaigns'">
          <div class="tw-h-full tw-flex tw-flex-col">
            <div class="tw-mb-3">
              <h3 class="tw-text-lg lg:tw-text-xl tw-font-bold tw-text-theme-text tw-mb-0.5">{{ t('affiliateProgram.campaigns.heading') }}</h3>
              <p class="tw-text-xs lg:tw-text-sm tw-text-theme-text-secondary">{{ t('affiliateProgram.campaigns.subtitle') }}</p>
            </div>

            <div v-if="loadingCampaigns" class="tw-flex tw-justify-center tw-py-10">
              <v-progress-circular indeterminate color="var(--color-header-bg, #360952)" size="36" />
            </div>

            <div v-else-if="!campaigns.length" class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12 tw-gap-3">
              <v-icon size="48" class="affiliate-empty-icon">mdi-bullhorn-outline</v-icon>
              <p class="tw-text-sm tw-text-theme-text-secondary">{{ t('affiliateProgram.campaigns.noCampaigns') }}</p>
              <v-btn variant="elevated" size="small" class="tw-font-bold affiliate-btn-primary" @click="showCreateDialog = true">
                <v-icon size="14" class="tw-mr-1">mdi-plus</v-icon>
                GET STARTED
              </v-btn>
            </div>

            <div v-else class="campaign-grid tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-3 tw-content-start tw-overflow-y-auto">
              <div
                v-for="campaign in campaigns"
                :key="campaign.id"
                class="affiliate-campaign-card tw-p-3 tw-flex tw-flex-col tw-gap-2 tw-self-start"
              >
                <!-- Campaign header -->
                <div class="tw-flex tw-items-center tw-gap-2">
                  <v-avatar size="28" class="affiliate-avatar tw-shrink-0">
                    <v-icon size="15">mdi-bullhorn</v-icon>
                  </v-avatar>
                  <div class="tw-flex-1 tw-min-w-0">
                    <p class="tw-text-sm tw-font-bold tw-truncate tw-leading-tight affiliate-text-primary">{{ campaign.name }}</p>
                    <span class="tw-text-[10px] tw-font-semibold affiliate-accent-text">
                      {{ campaign.campaign_id }}
                    </span>
                  </div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    class="affiliate-icon-btn"
                    @click="viewCampaign(campaign)"
                  >
                    <v-icon size="16">mdi-eye-outline</v-icon>
                  </v-btn>
                </div>

                <div class="tw-grid tw-grid-cols-3 tw-gap-1 tw-pt-2">
                  <div class="tw-text-center">
                    <p class="tw-text-[10px] tw-text-theme-text tw-leading-none">{{ t('affiliateProgram.campaigns.quickStats.signUps') }}</p>
                    <p class="tw-text-sm tw-font-bold tw-text-theme-text tw-leading-tight tw-mt-0.5">{{ campaign.lifetime_signups ?? 0 }}</p>
                  </div>
                  <div class="tw-text-center">
                    <p class="tw-text-[10px] tw-text-theme-text tw-leading-none">{{ t('affiliateProgram.campaigns.quickStats.ftd') }}</p>
                    <p class="tw-text-sm tw-font-bold tw-text-theme-text tw-leading-tight tw-mt-0.5">{{ campaign.lifetime_first_deposits ?? 0 }}</p>
                  </div>
                  <div class="tw-text-center">
                    <p class="tw-text-[10px] tw-text-theme-text-text tw-leading-none">{{ t('affiliateProgram.campaigns.quickStats.commission') }}</p>
                    <p class="tw-text-sm tw-font-bold tw-leading-tight tw-mt-0.5 affiliate-accent-text">{{ campaign.available_commission ?? 0 }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ── FUNDS TAB ── -->
        <div v-else-if="activeTab === 'funds'" class="tw-flex tw-flex-col tw-gap-3">

        <!-- Top row: two cards side by side -->
        <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">

          <!-- Total Withdrawn -->
          <div
            class="affiliate-funds-card tw-relative tw-p-4 sm:tw-p-5 tw-overflow-hidden tw-opacity-0 tw-animate-slideInUp"
            style="animation-delay: 0.1s"
          >
            <div class="tw-relative tw-z-10">
              <div class="tw-flex tw-items-center tw-gap-1.5 tw-mb-3">
                <v-avatar size="28" class="affiliate-avatar"><v-icon size="15">mdi-bank</v-icon></v-avatar>
                  <span class="tw-text-xs tw-text-theme-text tw-font-semibold tw-tracking-wider tw-uppercase">{{ t('affiliateProgram.funds.topCard.label') }}</span>
              </div>
              <div>
                <div class="tw-flex tw-items-stretch tw-w-full">
                  <div class="tw-flex-1 tw-min-w-0">
                      <p class="tw-text-xs tw-text-theme-text tw-leading-none">{{ t('affiliateProgram.funds.topCard.total') }}</p>
                    <p class="tw-text-2xl tw-font-bold tw-text-theme-text tw-mt-1">{{ fundsSummary.total_commission }}</p>
                  </div>
                  <div class="tw-w-px tw-bg-theme-border tw-mx-4 tw-self-stretch tw-rounded-full"></div>
                  <div class="tw-flex-1 tw-min-w-0">
                      <p class="tw-text-xs tw-text-theme-text tw-leading-none">{{ t('affiliateProgram.funds.topCard.withdrawn') }}</p>
                    <p class="tw-text-2xl tw-font-bold tw-text-theme-text tw-mt-1">{{ fundsSummary.withdrawn }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Available + Withdrawal -->
          <div
            class="affiliate-funds-card tw-relative tw-p-4 sm:tw-p-5 tw-overflow-hidden tw-opacity-0 tw-animate-slideInUp"
            style="animation-delay: 0.2s"
          >
            <div class="tw-relative tw-z-10">
              <div class="tw-flex tw-items-center tw-gap-1.5 tw-mb-3">
                <v-avatar size="28" class="affiliate-avatar"><v-icon size="15">mdi-wallet</v-icon></v-avatar>
                  <span class="tw-text-xs tw-text-theme-text tw-font-semibold tw-tracking-wider tw-uppercase">{{ t('affiliateProgram.funds.availableCard.label') }}</span>
              </div>
              <div class="tw-flex tw-items-end tw-justify-between tw-gap-3">
                <div>
                    <p class="tw-text-xs tw-text-theme-text tw-leading-none tw-tracking-wide">{{ t('affiliateProgram.funds.availableCard.available') }}</p>
                  <p class="tw-text-2xl tw-font-bold tw-text-theme-text tw-mt-1">{{ fundsSummary.available }}</p>
                </div>
                <v-btn 
                  variant="elevated" 
                  size="small" 
                  class="tw-font-semibold tw-rounded-lg tw-shrink-0 affiliate-btn-primary"
                  :disabled="fundsSummary.available <= 0"
                  @click="showWithdrawDialog = true"
                >
                  <v-icon size="15" class="tw-mr-1">mdi-cash-refund</v-icon>
                    {{ t('affiliateProgram.funds.availableCard.withdrawalButton') }}
                </v-btn>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- ── WITHDRAWAL HISTORY TAB ── -->
        <div v-else-if="activeTab === 'withdrawal-history'">
        <div class="affiliate-withdrawal-panel tw-overflow-hidden">
          <!-- Header with Title and Filters -->
          <div class="affiliate-withdrawal-panel__header tw-p-3 lg:tw-p-4">
            <div class="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-4">
              <div>
                <h3 class="tw-text-lg lg:tw-text-xl tw-font-bold tw-text-theme-text tw-mb-1">
                  {{ t('affiliateProgram.withdrawalHistory.heading') }}
                </h3>
                <p class="tw-text-xs lg:tw-text-sm tw-text-theme-text-secondary">
                  {{ t('affiliateProgram.withdrawalHistory.subtitle') }}
                </p>
              </div>

              <!-- Date Filter and Refresh -->
              <div class="tw-flex tw-items-center tw-gap-2 tw-w-full sm:tw-w-auto">
                <v-menu
                  v-model="showDateMenu"
                  :close-on-content-click="false"
                  min-width="auto"
                >
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      variant="outlined"
                      size="small"
                      class="affiliate-date-btn tw-flex-1 sm:tw-flex-none"
                    >
                      <v-icon size="18" class="tw-mr-1">mdi-calendar</v-icon>
                      <span class="tw-hidden sm:tw-inline">{{ formattedDate }}</span>
                      <span class="sm:tw-hidden">{{ withdrawalDate }}</span>
                    </v-btn>
                  </template>
                  <v-date-picker
                    v-model="withdrawalDate"
                    @update:model-value="handleDateChange"
                    color="var(--color-header-bg, #360952)"
                  />
                </v-menu>

                <v-btn
                  @click="loadWithdrawalHistory()"
                  icon
                  size="small"
                  variant="text"
                  class="affiliate-icon-btn tw-shrink-0"
                  :loading="loadingWithdrawalHistory"
                >
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Data Table -->
          <div class="account-page-table-wrap">
          <div class="account-page-table-scroll">
          <v-data-table
            :headers="withdrawalHeaders"
            :items="withdrawalHistory"
            :loading="loadingWithdrawalHistory"
            class="tw-bg-transparent account-page-table"
            density="compact"
            :items-per-page="10"
          >
            <!-- Transaction ID Column -->
            <template #item.transaction_id="{ item }">
              <span class="account-page-cell tw-font-mono">
                {{ item.transaction_unique_id || '-' }}
              </span>
            </template>

            <template #item.amount="{ item }">
              <span class="account-page-cell account-page-cell--positive">
                {{ formatCurrency(item.amount) }}
              </span>
            </template>

            <template #item.created_on="{ item }">
              <span class="account-page-cell account-page-cell--nowrap">
                {{ formatDateTime(item.created_on) }}
              </span>
            </template>

            <template #no-data>
              <div class="account-page-empty tw-text-center tw-py-12">
                <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-history</v-icon>
                <p class="account-page-empty__title">{{ t('affiliateProgram.withdrawalHistory.noData.title') }}</p>
                <p class="account-page-empty__note">{{ t('affiliateProgram.withdrawalHistory.noData.description') }}</p>
              </div>
            </template>
          </v-data-table>
          </div>
          </div>
        </div>
        </div>
      </div>

    </div>

    <!-- Campaign Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="480" :overlay-opacity="0.7" content-class="affiliate-dialog">
      <div v-if="selectedCampaign">
        <v-card class="affiliate-themed-dialog-card campaign-dialog-card">
        <v-card-title class="affiliate-themed-dialog-title tw-flex tw-items-center tw-gap-3 tw-px-6 tw-pt-5 tw-pb-2">
          <v-avatar size="32" class="affiliate-avatar">
            <v-icon size="17">mdi-bullhorn</v-icon>
          </v-avatar>
          <div class="tw-flex-1 tw-min-w-0">
            <p class="tw-text-theme-text tw-font-bold tw-text-lg tw-leading-tight">{{ selectedCampaign.name }}</p>
            <p class="tw-text-xs tw-text-theme-text tw-font-semibold">{{ selectedCampaign.campaign_id }}</p>
          </div>
        </v-card-title>

        <v-card-text class="tw-px-6 tw-pb-4">
          <!-- Stats grid -->
          <div class="tw-grid tw-grid-cols-2 tw-gap-3 tw-mb-4">
            <div class="tw-bg-theme-surface-alt tw-border tw-border-theme-border tw-rounded-lg tw-p-3">
              <p class="tw-text-xs tw-text-theme-text">{{ t('affiliateProgram.campaigns.detailDialog.stats.signUps') }}</p>
              <p class="tw-text-xl tw-font-bold tw-text-theme-text">{{ selectedCampaign.lifetime_signups ?? 0 }}</p>
            </div>
            <div class="tw-bg-theme-surface-alt tw-border tw-border-theme-border tw-rounded-lg tw-p-3">
              <p class="tw-text-xs tw-text-theme-text">{{ t('affiliateProgram.campaigns.detailDialog.stats.firstTimeDeposits') }}</p>
              <p class="tw-text-xl tw-font-bold tw-text-theme-text">{{ selectedCampaign.lifetime_first_deposits ?? 0 }}</p>
            </div>
            <div class="tw-bg-theme-surface-alt tw-border tw-border-theme-border tw-rounded-lg tw-p-3">
              <p class="tw-text-xs tw-text-theme-text">{{ t('affiliateProgram.campaigns.detailDialog.stats.ftdAmount') }}</p>
              <p class="tw-text-xl tw-font-bold tw-text-theme-text">{{ selectedCampaign.lifetime_ftd_amount ?? 0 }}</p>
            </div>
            <div class="tw-bg-theme-surface-alt tw-border tw-border-theme-border tw-rounded-lg tw-p-3">
              <p class="tw-text-xs tw-text-theme-text">{{ t('affiliateProgram.campaigns.detailDialog.stats.availableCommission') }}</p>
              <p class="tw-text-xl tw-font-bold affiliate-accent-text">{{ selectedCampaign.available_commission ?? 0 }}</p>
            </div>
          </div>

          <!-- Referral link -->
          <div class="tw-rounded-xl tw-p-4 tw-backdrop-blur-sm referral-link-box">
            <p class="tw-text-xs tw-text-theme-text tw-mb-2 tw-font-bold tw-uppercase tw-tracking-wider">{{ t('affiliateProgram.campaigns.detailDialog.referralLink') }}</p>
            <div class="tw-flex tw-items-start tw-gap-2">
              <code class="tw-flex-1 tw-text-sm tw-font-mono tw-font-bold tw-break-all tw-leading-relaxed tw-bg-white/5 tw-px-2 tw-py-1.5 tw-rounded referral-code">{{ getReferralLink(selectedCampaign) }}</code>
              <v-btn icon size="small" variant="text" class="affiliate-icon-btn tw-shrink-0" @click="copyLink(selectedCampaign)">
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="tw-px-6 tw-pb-5">
          <v-spacer />
          <v-btn variant="elevated" class="affiliate-btn-primary" @click="showDetailDialog = false">{{ t('affiliateProgram.campaigns.detailDialog.close') }}</v-btn>
        </v-card-actions>
        </v-card>
      </div>
    </v-dialog>

    <!-- Create Campaign Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="480" :overlay-opacity="0.7" content-class="affiliate-dialog affiliate-create-dialog">
      <v-card class="affiliate-themed-dialog-card">
        <v-card-title class="tw-text-theme-text tw-font-bold tw-px-6 tw-pt-5 tw-pb-2 affiliate-themed-dialog-title">
          {{ t('affiliateProgram.campaigns.createDialog.title') }}
        </v-card-title>
        <v-card-text class="tw-px-6 tw-pb-2 affiliate-themed-dialog-body">
          <v-text-field
            v-model="newCampaign.name"
            :label="t('affiliateProgram.campaigns.createDialog.nameLabel')"
            variant="outlined"
            density="comfortable"
            color="var(--color-header-bg, #360952)"
            base-color="theme-text-secondary"
            bg-color="theme-surface"
            class="tw-mb-3 affiliate-dialog-field"
          />
          <v-text-field
            v-model="newCampaign.campaign_id"
            :label="t('affiliateProgram.campaigns.createDialog.campaignIdLabel')"
            variant="outlined"
            density="comfortable"
            color="var(--color-header-bg, #360952)"
            base-color="theme-text-secondary"
            bg-color="theme-surface"
            :hint="t('affiliateProgram.campaigns.createDialog.campaignIdHint')"
            persistent-hint
            class="affiliate-dialog-field"
          />
        </v-card-text>
        <v-card-actions class="tw-px-6 tw-pb-5 tw-gap-2">
          <v-spacer />
          <v-btn variant="outlined" class="affiliate-btn-secondary" @click="showCreateDialog = false">{{ t('affiliateProgram.campaigns.createDialog.cancel') }}</v-btn>
          <v-btn
            variant="elevated"
            class="affiliate-btn-primary"
            :loading="creatingCampaign"
            :disabled="!newCampaign.name.trim() || !newCampaign.campaign_id.trim()"
            @click="handleCreateCampaign"
          >
            {{ t('affiliateProgram.campaigns.createDialog.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Withdrawal Confirmation Dialog -->
    <v-dialog v-model="showWithdrawDialog" max-width="480" :overlay-opacity="0.7" content-class="affiliate-dialog">
      <v-card class="affiliate-themed-dialog-card">
        <v-card-title class="affiliate-themed-dialog-title tw-flex tw-items-center tw-gap-3 tw-px-6 tw-pt-5 tw-pb-2">
          <v-avatar size="40" class="affiliate-avatar">
            <v-icon size="24">mdi-cash-refund</v-icon>
          </v-avatar>
          <div>
            <h2 class="tw-text-lg tw-font-bold tw-text-theme-text">{{ t('affiliateProgram.withdrawalConfirmation.title') }}</h2>
            <p class="tw-text-xs tw-text-theme-text-secondary tw-mt-0.5">{{ t('affiliateProgram.withdrawalConfirmation.subtitle') }}</p>
          </div>
        </v-card-title>

        <v-card-text class="tw-px-6 tw-pb-4">
          <!-- Summary box -->
          <div class="tw-bg-theme-surface-alt tw-rounded-xl tw-p-4 tw-mb-4">
            <div class="tw-grid tw-grid-cols-2 tw-gap-3">
              <div>
                <p class="tw-text-xs tw-text-theme-text-secondary tw-mb-1">{{ t('affiliateProgram.withdrawalConfirmation.summary.availableToWithdraw') }}</p>
                <p class="tw-text-2xl tw-font-bold affiliate-accent-text">{{ fundsSummary.available }}</p>
              </div>
              <div>
                <p class="tw-text-xs tw-text-theme-text-secondary tw-mb-1">{{ t('affiliateProgram.withdrawalConfirmation.summary.alreadyWithdrawn') }}</p>
                <p class="tw-text-2xl tw-font-bold tw-text-theme-text">{{ fundsSummary.withdrawn }}</p>
              </div>
            </div>
          </div>

          <!-- Info message -->
          <p class="tw-text-sm tw-text-theme-text-secondary tw-leading-relaxed">
            {{ t('affiliateProgram.withdrawalConfirmation.info') }}
          </p>
        </v-card-text>

        <v-card-actions class="tw-px-6 tw-pb-5 tw-gap-2">
          <v-spacer />
          <v-btn 
            variant="text" 
            color="default" 
            @click="showWithdrawDialog = false"
            :disabled="withdrawingCommission"
          >
            {{ t('affiliateProgram.withdrawalConfirmation.cancel') }}
          </v-btn>
          <v-btn
            variant="elevated"
            class="affiliate-btn-primary"
            :loading="withdrawingCommission"
            @click="handleWithdrawCommission"
          >
            {{ t('affiliateProgram.withdrawalConfirmation.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getCampaigns as fetchCampaignsApi,
  createCampaign as createCampaignApi,
  getAffiliateFunds as fetchAffiliateFundsApi,
  withdrawCommission as withdrawCommissionApi,
  getWithdrawalHistory as fetchWithdrawalHistoryApi,
} from '@/api/user/campaign'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { toYMDLocal } from '@/utils/dateUtils.js'
import useDevices from '@/composables/useDevices'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'

const { t } = useI18n()
const { isMobile } = useDevices()

const { showSuccess, showError } = useSnackbar()

// Tabs
const tabs = computed(() => [
  { key: 'campaigns', label: t('affiliateProgram.tabs.campaigns'), icon: 'mdi-bullhorn-outline' },
  { key: 'funds', label: t('affiliateProgram.tabs.funds'), icon: 'mdi-bank-outline' },
  { key: 'withdrawal-history', label: isMobile.value ? 'History' : t('affiliateProgram.tabs.withdrawalHistory'), icon: 'mdi-history' },
])
const activeTab = ref('campaigns')

// Campaigns
const loadingCampaigns = ref(false)
const campaigns = ref([])
const fundsSummary = ref({
  available: 0,
  withdrawn: 0,
  total_commission: 0,
})

const totalAvailableCommission = computed(() =>
  campaigns.value.reduce((sum, c) => sum + (Number(c.available_commission) || 0), 0)
)
const totalCommission = computed(() =>
  campaigns.value.reduce((sum, c) => sum + (Number(c.total_commission) || 0), 0)
)
const totalFtdAmount = computed(() =>
  campaigns.value.reduce((sum, c) => sum + (Number(c.lifetime_ftd_amount) || 0), 0)
)
const totalFirstDeposits = computed(() =>
  campaigns.value.reduce((sum, c) => sum + (Number(c.lifetime_first_deposits) || 0), 0)
)
const totalSignups = computed(() =>
  campaigns.value.reduce((sum, c) => sum + (Number(c.lifetime_signups) || 0), 0)
)

const loadCampaigns = async () => {
  loadingCampaigns.value = true
  try {
    const res = await fetchCampaignsApi()
    campaigns.value = res.data ?? []
  } catch (e) {
    showError(t('affiliateProgram.snackbar.loadCampaignsFailed'))
  } finally {
    loadingCampaigns.value = false
  }
}

const loadFundsSummary = async () => {
  try {
    const res = await fetchAffiliateFundsApi()
    fundsSummary.value = {
      available: Number(res?.data?.available || 0),
      withdrawn: Number(res?.data?.withdrawn || 0),
      total_commission: Number(res?.data?.total_commission || 0),
    }
  } catch (e) {
    showError(t('affiliateProgram.snackbar.loadFundsSummaryFailed'))
  }
}

onMounted(async () => {
  await Promise.all([loadCampaigns(), loadFundsSummary()])
})

// Campaign detail dialog
const showDetailDialog = ref(false)
const selectedCampaign = ref(null)

function viewCampaign(campaign) {
  selectedCampaign.value = campaign
  showDetailDialog.value = true
}

const signupDomain = (import.meta.env.VITE_SIGNUP_DOMAIN || '').trim()

function getSignupBaseUrl() {
  if (!signupDomain) return window.location.origin
  const withProtocol = /^https?:\/\//i.test(signupDomain)
    ? signupDomain
    : `https://${signupDomain}`
  return withProtocol.replace(/\/+$/, '')
}

function getReferralLink(campaign) {
  const campaignId = encodeURIComponent(campaign?.campaign_id ?? '')
  return `${getSignupBaseUrl()}/signup?campaign_id=${campaignId}`
}

function copyLink(campaign) {
  const link = getReferralLink(campaign)
  navigator.clipboard?.writeText(link)
  showSuccess(t('affiliateProgram.snackbar.referralCopied'))
}

// Withdrawal History
const withdrawalDate = ref(toYMDLocal(new Date()))
const withdrawalHistory = ref([])
const loadingWithdrawalHistory = ref(false)
const showDateMenu = ref(false)

const formattedDate = computed(() => {
  if (!withdrawalDate.value) return ''
  const date = new Date(withdrawalDate.value)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

const loadWithdrawalHistory = async (dateStr = withdrawalDate.value) => {
  if (!dateStr) {
    showError(t('affiliateProgram.snackbar.pleaseSelectDate'))
    return
  }
  
  // Ensure date is in YYYY-MM-DD format
  let formattedDateStr = dateStr
  if (dateStr instanceof Date) {
    formattedDateStr = toYMDLocal(dateStr)
  } else if (typeof dateStr === 'string' && dateStr.length > 10) {
    formattedDateStr = dateStr.split('T')[0]
  }
  
  loadingWithdrawalHistory.value = true
  try {
    const res = await fetchWithdrawalHistoryApi(formattedDateStr)
    withdrawalHistory.value = res.data ?? []
  } catch (e) {
    showError(t('affiliateProgram.snackbar.loadWithdrawalHistoryFailed'))
    withdrawalHistory.value = []
  } finally {
    loadingWithdrawalHistory.value = false
  }
}

const handleDateChange = () => {
  showDateMenu.value = false
  loadWithdrawalHistory()
}

// Withdrawal History table headers
const withdrawalHeaders = computed(() => [
  { title: t('affiliateProgram.withdrawalHistory.tableHeaders.transactionId'), key: 'transaction_id', sortable: false },
  { title: t('affiliateProgram.withdrawalHistory.tableHeaders.amount'), key: 'amount', sortable: true },
  { title: t('affiliateProgram.withdrawalHistory.tableHeaders.dateTime'), key: 'created_on', sortable: true },
])

// Format currency - remove dollar sign and use locale number formatting
const formatCurrency = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Format date time
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Create campaign dialog
const showCreateDialog = ref(false)
const creatingCampaign = ref(false)
const newCampaign = ref({ name: '', campaign_id: '' })

async function handleCreateCampaign() {
  if (!newCampaign.value.name.trim() || !newCampaign.value.campaign_id.trim()) return
  creatingCampaign.value = true
  try {
    await createCampaignApi({
      name: newCampaign.value.name.trim(),
      campaign_id: newCampaign.value.campaign_id.trim(),
    })
    showSuccess(t('affiliateProgram.snackbar.campaignCreated'))
    showCreateDialog.value = false
    newCampaign.value = { name: '', campaign_id: '' }
    await loadCampaigns()
  } catch (e) {
    showError(e?.response?.data?.message ?? t('affiliateProgram.snackbar.createCampaignFailed'))
  } finally {
    creatingCampaign.value = false
  }
}

// Withdrawal dialog
const showWithdrawDialog = ref(false)
const withdrawingCommission = ref(false)

async function handleWithdrawCommission() {
  withdrawingCommission.value = true
  try {
    const res = await withdrawCommissionApi()
    fundsSummary.value = {
      available: Number(res?.data?.available || 0),
      withdrawn: Number(res?.data?.withdrawn || 0),
      total_commission: Number(res?.data?.total_commission || 0),
    }
    showSuccess(t('affiliateProgram.snackbar.commissionWithdrawn'))
    showWithdrawDialog.value = false
  } catch (e) {
    showError(e?.response?.data?.message ?? t('affiliateProgram.snackbar.withdrawCommissionFailed'))
  } finally {
    withdrawingCommission.value = false
  }
}

// Load withdrawal history when tab changes
watch(activeTab, async (newVal) => {
  if (newVal === 'withdrawal-history' && withdrawalHistory.value.length === 0) {
    await loadWithdrawalHistory()
  }
})
</script>

<style scoped>
.affiliate-program {
  --affiliate-accent: var(--color-header-bg, #360952);
  --affiliate-accent-mid: #8a19ce;
  --affiliate-btn-gradient: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%);
  --affiliate-panel: #ffffff;
  --affiliate-card: #ffffff;
  --affiliate-muted: #6b7280;
  --affiliate-border: #e5e7eb;
  min-height: 100%;
}

.affiliate-program__body {
  padding: 12px 12px 16px;
}

.affiliate-kpi-card {
  background: var(--affiliate-card);
  border: 1px solid var(--affiliate-border);
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: rgba(100, 100, 111, 0.12) 0 4px 16px;
}

.affiliate-kpi-label {
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--affiliate-accent);
  margin-bottom: 8px;
}

.affiliate-kpi-value {
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 700;
  color: #111111;
}

.affiliate-kpi-note {
  margin-top: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--affiliate-muted);
}

.affiliate-kpi-split {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: end;
}

.affiliate-kpi-divider {
  width: 1px;
  height: 48px;
  background: rgba(54, 9, 82, 0.2);
}

.affiliate-tabs {
  gap: 20px;
  border-bottom: 1px solid var(--affiliate-border);
  padding: 0 4px;
  background: #ffffff;
}

.affiliate-tab-btn {
  border: none;
  background: transparent;
  color: var(--affiliate-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 10px 0;
  position: relative;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.affiliate-tab-btn.tab-btn--active {
  color: var(--affiliate-accent);
}

.affiliate-tab-btn.tab-btn--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--affiliate-accent);
}

.affiliate-main-panel {
  background: var(--affiliate-panel);
  border: 1px solid var(--affiliate-border);
  border-top: none;
  border-radius: 0 0 8px 8px;
  min-height: 360px;
  box-shadow: rgba(100, 100, 111, 0.08) 0 4px 16px;
}

.affiliate-campaign-card,
.affiliate-funds-card,
.affiliate-withdrawal-panel {
  background: var(--affiliate-card);
  border: 1px solid var(--affiliate-border);
  border-radius: 8px;
  box-shadow: rgba(100, 100, 111, 0.1) 0 2px 10px;
}

.affiliate-withdrawal-panel__header {
  border-bottom: 1px solid var(--affiliate-border);
}

.affiliate-text-primary,
.affiliate-program :deep(.tw-text-theme-text),
.affiliate-program :deep(h3.tw-text-theme-text) {
  color: #111111 !important;
}

.affiliate-program :deep(.tw-text-theme-text-secondary),
.affiliate-program :deep(p.tw-text-theme-text-secondary) {
  color: var(--affiliate-muted) !important;
}

.affiliate-accent-text {
  color: var(--affiliate-accent) !important;
}

.affiliate-empty-icon {
  color: var(--affiliate-accent) !important;
  opacity: 0.9;
}

.affiliate-avatar {
  background: rgba(54, 9, 82, 0.1) !important;
}

.affiliate-avatar :deep(.v-icon) {
  color: var(--affiliate-accent) !important;
}

.affiliate-icon-btn :deep(.v-icon) {
  color: var(--affiliate-accent) !important;
}

.affiliate-date-btn {
  color: var(--affiliate-accent) !important;
  border-color: var(--affiliate-accent) !important;
  text-transform: none;
}

.affiliate-date-btn :deep(.v-btn__content),
.affiliate-date-btn :deep(.v-icon) {
  color: var(--affiliate-accent) !important;
}

.affiliate-btn-primary {
  background: var(--affiliate-btn-gradient) !important;
  color: #ffffff !important;
  border: 0 !important;
  box-shadow: 0 2px 8px rgba(54, 9, 82, 0.28) !important;
  text-transform: none;
  font-weight: 700;
}

.affiliate-btn-primary :deep(.v-btn__content),
.affiliate-btn-primary :deep(.v-icon) {
  color: #ffffff !important;
}

.affiliate-btn-primary:hover {
  filter: brightness(1.06);
}

.affiliate-btn-primary:disabled {
  opacity: 0.55 !important;
}

.affiliate-btn-primary--header {
  min-height: 28px !important;
  height: 28px !important;
  padding: 0 10px !important;
  font-size: 10px !important;
  border-radius: 6px !important;
}

.affiliate-btn-secondary {
  background: transparent !important;
  color: #374151 !important;
  border: 1px solid #d1d5db !important;
  text-transform: none;
}

.affiliate-btn-secondary :deep(.v-btn__content) {
  color: #374151 !important;
}

.affiliate-btn-secondary:hover {
  background: rgba(54, 9, 82, 0.06) !important;
  border-color: var(--affiliate-accent) !important;
  color: var(--affiliate-accent) !important;
}

.affiliate-btn-secondary:hover :deep(.v-btn__content) {
  color: var(--affiliate-accent) !important;
}

.affiliate-btn-secondary :deep(.v-btn__overlay) {
  opacity: 0 !important;
}

.affiliate-program .referral-link-box {
  background: #f5f5f5 !important;
  border: 1px solid var(--affiliate-border);
}

.affiliate-program .referral-code {
  color: var(--affiliate-accent) !important;
  background: rgba(54, 9, 82, 0.06) !important;
  border: 1px solid rgba(54, 9, 82, 0.2) !important;
}

.campaign-grid {
  max-height: 280px;
  overflow-y: auto;
}

.affiliate-funds-card .tw-w-px {
  background: rgba(54, 9, 82, 0.18) !important;
}

.affiliate-program :deep(.campaign-dialog-card .tw-bg-theme-surface-alt),
.affiliate-program :deep(.tw-bg-theme-surface-alt) {
  background: #f5f5f5 !important;
  border-color: var(--affiliate-border) !important;
}
</style>

<style>
.affiliate-dialog .affiliate-themed-dialog-card,
.affiliate-create-dialog .affiliate-themed-dialog-card {
  background: #ffffff !important;
  border: none !important;
  border-radius: 8px !important;
  box-shadow: 0 18px 40px rgba(54, 9, 82, 0.28) !important;
  overflow: hidden;
}

.affiliate-dialog .affiliate-themed-dialog-title,
.affiliate-create-dialog .affiliate-themed-dialog-title {
  background: var(--color-header-bg, #360952) !important;
  color: #ffffff !important;
  border-bottom: none;
  font-weight: 700 !important;
  font-size: 15px !important;
  letter-spacing: 0.02em;
  text-transform: none;
}

.affiliate-dialog .affiliate-themed-dialog-title .tw-text-theme-text,
.affiliate-create-dialog .affiliate-themed-dialog-title .tw-text-theme-text,
.affiliate-dialog .affiliate-themed-dialog-title .tw-text-theme-text-secondary,
.affiliate-create-dialog .affiliate-themed-dialog-title .tw-text-theme-text-secondary {
  color: #ffffff !important;
}

.affiliate-dialog .affiliate-themed-dialog-body,
.affiliate-create-dialog .affiliate-themed-dialog-body,
.affiliate-dialog .v-card-text {
  background: #ffffff;
  color: #111111 !important;
}

.affiliate-dialog .affiliate-dialog-field .v-field,
.affiliate-create-dialog .affiliate-dialog-field .v-field {
  background: #f5f5f5 !important;
  border-radius: 8px !important;
}

.affiliate-dialog .affiliate-dialog-field .v-field__outline,
.affiliate-create-dialog .affiliate-dialog-field .v-field__outline {
  color: #9ca3af !important;
}

.affiliate-dialog .affiliate-dialog-field .v-field--focused .v-field__outline,
.affiliate-create-dialog .affiliate-dialog-field .v-field--focused .v-field__outline {
  color: var(--color-header-bg, #360952) !important;
}

.affiliate-dialog .affiliate-dialog-field .v-label,
.affiliate-create-dialog .affiliate-dialog-field .v-label,
.affiliate-dialog .affiliate-dialog-field .v-field-label,
.affiliate-create-dialog .affiliate-dialog-field .v-field-label {
  color: #6b7280 !important;
  opacity: 1 !important;
}

.affiliate-dialog .affiliate-dialog-field input,
.affiliate-create-dialog .affiliate-dialog-field input,
.affiliate-dialog .affiliate-dialog-field .v-field__input,
.affiliate-create-dialog .affiliate-dialog-field .v-field__input {
  color: #111111 !important;
  -webkit-text-fill-color: #111111 !important;
  font-weight: 600;
}

.affiliate-dialog .affiliate-dialog-field .v-messages__message,
.affiliate-create-dialog .affiliate-dialog-field .v-messages__message {
  color: #dc2626 !important;
}

.affiliate-dialog .affiliate-btn-primary,
.affiliate-create-dialog .affiliate-btn-primary {
  background: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%) !important;
  color: #ffffff !important;
  border: 0 !important;
  text-transform: none;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(54, 9, 82, 0.28) !important;
}

.affiliate-dialog .affiliate-btn-primary .v-btn__content,
.affiliate-create-dialog .affiliate-btn-primary .v-btn__content,
.affiliate-dialog .affiliate-btn-primary .v-icon,
.affiliate-create-dialog .affiliate-btn-primary .v-icon {
  color: #ffffff !important;
}

.affiliate-dialog .affiliate-btn-secondary,
.affiliate-create-dialog .affiliate-btn-secondary {
  background: transparent !important;
  color: #374151 !important;
  border: 1px solid #d1d5db !important;
}

.affiliate-dialog .affiliate-btn-secondary .v-btn__content,
.affiliate-create-dialog .affiliate-btn-secondary .v-btn__content {
  color: #374151 !important;
}

.affiliate-dialog .affiliate-btn-secondary:hover,
.affiliate-create-dialog .affiliate-btn-secondary:hover {
  background: rgba(54, 9, 82, 0.06) !important;
  border-color: var(--color-header-bg, #360952) !important;
  color: var(--color-header-bg, #360952) !important;
}

.affiliate-dialog .affiliate-btn-secondary:hover .v-btn__content,
.affiliate-create-dialog .affiliate-btn-secondary:hover .v-btn__content {
  color: var(--color-header-bg, #360952) !important;
}

.affiliate-dialog .affiliate-btn-secondary .v-btn__overlay,
.affiliate-create-dialog .affiliate-btn-secondary .v-btn__overlay {
  opacity: 0 !important;
}

.affiliate-dialog .affiliate-avatar,
.affiliate-create-dialog .affiliate-avatar {
  background: rgba(255, 255, 255, 0.18) !important;
}

.affiliate-dialog .affiliate-themed-dialog-title .affiliate-avatar .v-icon,
.affiliate-create-dialog .affiliate-themed-dialog-title .affiliate-avatar .v-icon {
  color: #ffffff !important;
}

.affiliate-dialog .affiliate-accent-text {
  color: var(--color-header-bg, #360952) !important;
}
</style>
