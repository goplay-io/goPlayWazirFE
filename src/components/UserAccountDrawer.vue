<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { USER_DRAWER_NAV_SECTIONS } from '@/constants/userDrawerNavItems.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userName: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  balance: {
    type: String,
    default: '0',
  },
  freeCash: {
    type: String,
    default: 'N/A',
  },
  exposure: {
    type: String,
    default: '0',
  },
  /** @deprecated Prefer balance / freeCash / exposure props. Still used as fallback. */
  walletRows: {
    type: Array,
    default: () => [],
  },
  navSections: {
    type: Array,
    default: () => USER_DRAWER_NAV_SECTIONS,
  },
  /** Flat fallback if sections not provided by older callers. */
  navItems: {
    type: Array,
    default: () => [],
  },
  showWalletSummary: {
    type: Boolean,
    default: true,
  },
  showPaymentActions: {
    type: Boolean,
    default: true,
  },
  showClaimBonus: {
    type: Boolean,
    default: false,
  },
  showDownloadApk: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'logout',
  'navigate',
  'deposit',
  'withdraw',
  'claim-bonus',
  'exposure-click',
  'customer-support',
  'download-apk',
])

const { t } = useI18n()

const drawerOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const displayPhone = computed(() => {
  const phone = String(props.phone || '').trim()
  if (phone) return phone
  return props.userName || ''
})

const balanceValue = computed(() => {
  if (props.balance) return props.balance
  const row = props.walletRows.find((r) => r.key === 'balance')
  return row?.value ?? '0'
})

const freeCashValue = computed(() => {
  if (props.freeCash) return props.freeCash
  const row = props.walletRows.find((r) => r.key === 'cashable' || r.key === 'freeCash')
  return row?.value ?? 'N/A'
})

const exposureValue = computed(() => {
  if (props.exposure) return props.exposure
  const row = props.walletRows.find((r) => r.key === 'exposure')
  return row?.value ?? '0'
})

const sections = computed(() => {
  if (props.navSections?.length) {
    return props.navSections
      .map((section) => ({
        ...section,
        items: (section.items || []).filter((item) => {
          if (item.action === 'download-apk' && !props.showDownloadApk) return false
          return true
        }),
      }))
      .filter((section) => section.items.length > 0)
  }
  if (props.navItems?.length) {
    return [{ id: 'nav', titleKey: '', items: props.navItems }]
  }
  return []
})

function closeDrawer() {
  drawerOpen.value = false
}

function handleNavItem(item) {
  if (item.action === 'logout') {
    emit('logout')
    return
  }
  if (item.action === 'customer-support') {
    emit('customer-support')
    closeDrawer()
    return
  }
  if (item.action === 'download-apk') {
    emit('download-apk')
    closeDrawer()
    return
  }
  if (item.action === 'exposure') {
    emit('exposure-click')
    closeDrawer()
    return
  }
  emit('navigate', item)
  closeDrawer()
}

function handleDeposit() {
  emit('deposit')
  closeDrawer()
}

function handleWithdraw() {
  emit('withdraw')
  closeDrawer()
}

function handleClaimBonus() {
  emit('claim-bonus')
  closeDrawer()
}

function handleExposureClick() {
  emit('exposure-click')
  closeDrawer()
}
</script>

<template>
  <Teleport to="body">
    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      temporary
      :width="384"
      class="user-account-drawer"
      scrim="rgba(0, 0, 0, 0.55)"
      :style="{ top: '0px', height: '100dvh' }"
    >
      <div class="user-account-drawer__panel">
        <ul class="user-account-drawer__list">
          <!-- Identity -->
          <li class="user-account-drawer__identity">
            <div class="user-account-drawer__identity-main">
              <v-icon size="22" class="user-account-drawer__accent-icon">mdi-cellphone</v-icon>
              <span class="user-account-drawer__phone">{{ displayPhone }}</span>
            </div>
            <button
              type="button"
              class="user-account-drawer__close"
              aria-label="Close"
              @click="closeDrawer"
            >
              <v-icon size="20">mdi-close</v-icon>
            </button>
          </li>

          <!-- Balance -->
          <li v-if="showWalletSummary" class="user-account-drawer__balance-block">
            <div class="user-account-drawer__balance-heading">
              <v-icon size="20" class="user-account-drawer__accent-icon">mdi-bank-outline</v-icon>
              <span>{{ t('header.user.drawer.balanceInformation') }}</span>
            </div>

            <div class="user-account-drawer__balance-grid">
              <div class="user-account-drawer__balance-card user-account-drawer__balance-card--full">
                <span class="user-account-drawer__balance-label">
                  {{ t('header.user.walletSummary.balance') }}
                </span>
                <span class="user-account-drawer__balance-value user-account-drawer__balance-value--success">
                  ₹ {{ balanceValue }}
                </span>
              </div>
              <div class="user-account-drawer__balance-card">
                <span class="user-account-drawer__balance-label">
                  {{ t('header.user.drawer.freeCash') }}
                </span>
                <span class="user-account-drawer__balance-value">
                  ₹ {{ freeCashValue }}
                </span>
              </div>
              <button
                type="button"
                class="user-account-drawer__balance-card user-account-drawer__balance-card--clickable"
                @click="handleExposureClick"
              >
                <span class="user-account-drawer__balance-label">
                  {{ t('header.user.drawer.exposure') }}
                </span>
                <span class="user-account-drawer__balance-value user-account-drawer__balance-value--danger">
                  ₹ {{ exposureValue }}
                </span>
              </button>
            </div>

            <div v-if="showPaymentActions" class="user-account-drawer__payment-row">
              <button
                type="button"
                class="user-account-drawer__payment-btn user-account-drawer__payment-btn--deposit"
                @click="handleDeposit"
              >
                <v-icon size="22" class="user-account-drawer__payment-icon" icon="mdi-wallet-plus" />
                <span>{{ t('header.user.drawer.deposit') }}</span>
              </button>
              <button
                type="button"
                class="user-account-drawer__payment-btn user-account-drawer__payment-btn--withdraw"
                @click="handleWithdraw"
              >
                <v-icon size="22" class="user-account-drawer__payment-icon" icon="mdi-cash-minus" />
                <span>{{ t('header.user.drawer.withdraw') }}</span>
              </button>
            </div>

            <button
              v-if="showClaimBonus"
              type="button"
              class="user-account-drawer__claim-btn"
              @click="handleClaimBonus"
            >
              {{ t('header.user.drawer.claimBonuses') }}
            </button>
          </li>

          <!-- Grouped nav -->
          <template v-for="section in sections" :key="section.id">
            <li v-if="section.titleKey" class="user-account-drawer__section-title">
              {{ t(section.titleKey) }}
            </li>
            <li
              v-for="item in section.items"
              :key="item.to || item.action || item.title"
              class="user-account-drawer__nav-li"
            >
              <component
                :is="item.to ? 'router-link' : 'button'"
                :to="item.to || undefined"
                type="button"
                class="user-account-drawer__nav-item"
                @click="handleNavItem(item)"
              >
                <v-icon size="20" class="user-account-drawer__nav-icon">{{ item.icon }}</v-icon>
                <span class="user-account-drawer__nav-label">{{ t(item.title) }}</span>
              </component>
            </li>
          </template>
        </ul>
      </div>
    </v-navigation-drawer>
  </Teleport>
</template>

<style scoped>
.user-account-drawer.v-navigation-drawer {
  top: 0 !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  z-index: 3100 !important;
  background: #1f1f1f !important;
  background-color: #1f1f1f !important;
  background-image: none !important;
  border-left: 1px solid #333333;
  /* Override Vuetify theme surface (was purple / light). */
  --v-theme-surface: 31, 31, 31;
  --v-theme-on-surface: 255, 255, 255;
}

.user-account-drawer.v-navigation-drawer + .v-navigation-drawer__scrim {
  top: 0 !important;
  height: 100dvh !important;
  z-index: 3099 !important;
}

.user-account-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  background: #1f1f1f !important;
  background-color: #1f1f1f !important;
  color: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
}

.user-account-drawer__panel {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 0 calc(12px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background: #545454;
}

.user-account-drawer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.user-account-drawer__identity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #737373;
  background: #545454;
}

.user-account-drawer__identity-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.user-account-drawer__accent-icon {
  color: #4cae50 !important;
  flex-shrink: 0;
}

.user-account-drawer__phone {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-account-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4cae50;
  cursor: pointer;
  flex-shrink: 0;
}

.user-account-drawer__balance-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid #737373;
}

.user-account-drawer__balance-heading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

.user-account-drawer__balance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  width: 100%;
}

.user-account-drawer__balance-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px;
  border: 1px solid #d2d2d2;
  border-radius: 6px;
  background: #e8e8e8;
  text-align: left;
}

.user-account-drawer__balance-card--full {
  grid-column: 1 / -1;
}

.user-account-drawer__balance-card--clickable {
  cursor: pointer;
  font: inherit;
}

.user-account-drawer__balance-label {
  color: #505050;
  font-size: 8px;
  font-weight: 500;
  line-height: 1.2;
  text-transform: uppercase;
}

.user-account-drawer__balance-value {
  color: #333333;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}

.user-account-drawer__balance-value--success {
  color: #4cae50;
}

.user-account-drawer__balance-value--danger {
  color: #eb244f;
}

.user-account-drawer__payment-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  width: 100%;
}

.user-account-drawer__payment-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 52px;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  text-transform: capitalize;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.user-account-drawer__payment-icon {
  color: #ffffff !important;
  flex-shrink: 0;
  opacity: 1;
}

.user-account-drawer__payment-btn--deposit {
  background: linear-gradient(90deg, #17c964, #2e924b);
}

.user-account-drawer__payment-btn--withdraw {
  background: linear-gradient(90deg, #bd3726, #f9b134);
}

.user-account-drawer__claim-btn {
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  background: transparent;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.user-account-drawer__section-title {
  width: 100%;
  padding: 8px 12px;
  background: #545454;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  border-bottom: 1px solid #737373;
}

.user-account-drawer__nav-li {
  border-bottom: 1px solid #737373;
  background: #545454;
}

.user-account-drawer__nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 36px;
  padding: 8px 14px;
  border: 0;
  background: transparent;
  color: #ffffff;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.15s ease;
}

.user-account-drawer__nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-account-drawer__nav-icon {
  color: #4cae50 !important;
  flex-shrink: 0;
}

.user-account-drawer__nav-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
}
</style>
