<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userName: {
    type: String,
    default: '',
  },
  walletRows: {
    type: Array,
    default: () => [],
  },
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
])

const { t } = useI18n()

const drawerOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const displayName = computed(() => (props.userName || '').toUpperCase())

function closeDrawer() {
  drawerOpen.value = false
}

function handleNavItem(item) {
  emit('navigate', item)
  closeDrawer()
}

function handleWalletRowClick(row) {
  if (row?.key === 'exposure') {
    emit('exposure-click')
    closeDrawer()
  }
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
</script>

<template>
  <Teleport to="body">
    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      temporary
      :width="320"
      class="user-account-drawer"
      scrim="rgba(0, 0, 0, 0.55)"
      :style="{ top: '0px', height: '100dvh' }"
    >
      <div class="user-account-drawer__panel">
        <div class="user-account-drawer__shell">
          <header class="user-account-drawer__header">
            <div class="user-account-drawer__identity-row">
              <button
                type="button"
                class="user-account-drawer__close"
                aria-label="Close"
                @click="closeDrawer"
              >
                <svg
                  class="user-account-drawer__close-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <div class="user-account-drawer__identity">
                <img
                  src="/svg/green circleman.webp"
                  alt=""
                  class="user-account-drawer__avatar"
                  width="30"
                  height="30"
                />
                <span class="user-account-drawer__name">{{ displayName }}</span>
              </div>
            </div>

          <p v-if="showWalletSummary" class="user-account-drawer__section-title">
            {{ t('header.user.drawer.balanceInformation') }}
          </p>
        </header>

        <div v-if="showWalletSummary" class="user-account-drawer__stats">
          <div
            v-for="row in walletRows"
            :key="row.key"
            class="user-account-drawer__stat-row"
            :class="{ 'user-account-drawer__stat-row--clickable': row.key === 'exposure' }"
            :role="row.key === 'exposure' ? 'button' : undefined"
            :tabindex="row.key === 'exposure' ? 0 : undefined"
            @click="handleWalletRowClick(row)"
            @keydown.enter.prevent="handleWalletRowClick(row)"
            @keydown.space.prevent="handleWalletRowClick(row)"
          >
            <span class="user-account-drawer__stat-label">{{ t(row.labelKey) }}</span>
            <span class="user-account-drawer__stat-value">{{ row.value }}</span>
          </div>
        </div>

        <div v-if="showWalletSummary && showPaymentActions" class="user-account-drawer__payment-row">
          <button
            type="button"
            class="user-account-drawer__payment-btn user-account-drawer__payment-btn--outline"
            @click="handleDeposit"
          >
            {{ t('header.user.drawer.deposit') }}
          </button>
          <button
            type="button"
            class="user-account-drawer__payment-btn user-account-drawer__payment-btn--solid"
            @click="handleWithdraw"
          >
            {{ t('header.user.drawer.withdraw') }}
          </button>
        </div>

        <div v-if="showWalletSummary && showClaimBonus" class="user-account-drawer__claim-wrap">
          <button
            type="button"
            class="user-account-drawer__claim-btn"
            @click="handleClaimBonus"
          >
            {{ t('header.user.drawer.claimBonuses') }}
          </button>
        </div>

        <nav v-if="navItems.length" class="user-account-drawer__nav">
          <component
            v-for="(item, index) in navItems"
            :key="item.to || item.action || item.title"
            :is="item.to ? 'router-link' : 'button'"
            :to="item.to || undefined"
            type="button"
            class="user-account-drawer__nav-item"
            :class="{ 'user-account-drawer__nav-item--last': index === navItems.length - 1 }"
            @click="handleNavItem(item)"
          >
            <img
              v-if="item.iconSrc"
              :src="item.iconSrc"
              alt=""
              class="user-account-drawer__nav-icon-img"
              width="20"
              height="20"
            />
            <v-icon v-else size="20" class="user-account-drawer__nav-icon">{{ item.icon }}</v-icon>
            <span class="user-account-drawer__nav-label">{{ t(item.title) }}</span>
          </component>
        </nav>

        <div class="user-account-drawer__footer">
          <button type="button" class="user-account-drawer__logout" @click="emit('logout')">
            {{ t('header.user.drawer.logout') }}
          </button>
        </div>
        </div>
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
  background: var(--color-header-bg, #360952) !important;
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
  padding: 8px;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
}

.user-account-drawer__panel {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 100%;
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: transparent;
  color: #ffffff;
  padding: 0 8px calc(8px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.user-account-drawer__shell {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.user-account-drawer__close {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 6px;
  margin: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
}

.user-account-drawer__close-icon {
  display: block;
  width: 20px;
  height: 20px;
}

.user-account-drawer__header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0;
  padding: 0;
}

.user-account-drawer__identity-row {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 32px;
  margin: 8px;
  gap: 8px;
}

.user-account-drawer__identity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto;
  min-width: 0;
}

.user-account-drawer__avatar {
  display: block;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  object-fit: contain;
  flex-shrink: 0;
}

.user-account-drawer__name {
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: normal;
  line-height: 24px;
  margin-top: 1px;
  text-transform: uppercase;
}

.user-account-drawer__section-title {
  margin: 0;
  color: #ffffff;
  font-size: 15px;
  font-weight: 400;
  line-height: 22.5px;
  text-align: center;
}

.user-account-drawer__stats {
  padding: 0;
}

.user-account-drawer__stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  margin: 8px 0;
  border-bottom: 1px solid #ffffff;
}

.user-account-drawer__stat-row:last-child {
  margin-bottom: 12px;
}

.user-account-drawer__stat-row--clickable {
  cursor: pointer;
}

.user-account-drawer__stat-label {
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  line-height: 22.5px;
  letter-spacing: 0.025em;
  padding: 0 20px;
}

.user-account-drawer__stat-value {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  line-height: 27px;
  letter-spacing: 0.025em;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  padding: 0 8px;
}

.user-account-drawer__payment-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 20px 4px 0;
  padding: 0;
}

.user-account-drawer__payment-btn {
  min-height: 35px;
  height: 35px;
  padding: 0;
  border-radius: 3.12px;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  letter-spacing: normal;
  text-transform: uppercase;
  cursor: pointer;
}

.user-account-drawer__payment-btn--outline {
  border: 1px solid #ffffff;
  background: transparent;
  color: #ffffff;
}

.user-account-drawer__payment-btn--solid {
  border: 0;
  background: #ffffff;
  color: var(--color-header-bg, #360952);
}

.user-account-drawer__claim-wrap {
  padding: 14px 0 8px;
}

.user-account-drawer__claim-btn {
  width: 100%;
  min-height: 40px;
  padding: 0 16px;
  border: 2px solid #ffffff;
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
}

.user-account-drawer__nav {
  display: flex;
  flex-direction: column;
  margin-top: 0;
  padding: 0;
}

.user-account-drawer__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 57px;
  height: 57px;
  padding: 0 22px;
  border: 0;
  border-bottom: 1px solid #ffffff;
  background: transparent;
  color: #ffffff;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
}

.user-account-drawer__nav-item--last {
  border-bottom: 1px solid #ffffff;
}

.user-account-drawer__nav-icon {
  color: #ffffff !important;
  flex-shrink: 0;
}

.user-account-drawer__nav-icon-img {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: fill;
  flex-shrink: 0;
}

.user-account-drawer__nav-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  letter-spacing: 0.025em;
}

.user-account-drawer__footer {
  margin-top: auto;
  padding: 8px 0 0;
}

.user-account-drawer__logout {
  width: 100%;
  min-height: 56px;
  height: 56px;
  padding: 11px 22px;
  border: 0;
  border-radius: 5px;
  background: #ffffff;
  color: var(--color-header-bg, #360952);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: normal;
  text-transform: uppercase;
  cursor: pointer;
}
</style>
