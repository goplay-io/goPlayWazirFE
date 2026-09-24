<template>
  <div class="account-page bonuses-page">
    <AccountPageHeader :title="t('bonus.redeemable.title')">
      <template #actions>
        <button
          type="button"
          class="bonuses-help-btn"
          :aria-label="t('bonus.redeemable.title')"
          @click="showRedeemableHelp = true"
        >
          <v-icon size="20">mdi-help-circle-outline</v-icon>
        </button>
      </template>
    </AccountPageHeader>

    <div class="bonuses-toolbar">
      <v-text-field
        v-model="manualCouponCode"
        :label="t('bonus.redeemable.couponCode')"
        variant="outlined"
        density="compact"
        class="bonuses-coupon-field"
        :hide-details="!couponError"
        :error="!!couponError"
        :error-messages="couponError ? [couponError] : []"
        color="var(--color-header-bg, #360952)"
        base-color="#999999"
        bg-color="#f5f5f5"
        :disabled="claimingCode"
        @keyup.enter="handleClaimCode"
        @update:model-value="couponError = ''"
      />
      <v-btn
        variant="flat"
        class="bonuses-btn-primary"
        :loading="claimingCode"
        :disabled="!manualCouponCode?.trim() || !!redeemingId"
        @click="handleClaimCode"
      >
        {{ t('bonus.redeemable.claim') }}
      </v-btn>
    </div>

    <div class="bonuses-body">
      <div v-if="loading" class="bonuses-loading">
        <v-progress-circular
          indeterminate
          color="var(--color-header-bg, #360952)"
          size="48"
        />
      </div>

      <div v-else-if="!items.length" class="bonuses-empty">
        <v-icon size="56" class="bonuses-empty-icon">mdi-gift-outline</v-icon>
        <p class="bonuses-empty-text">{{ t('bonus.redeemable.noBonuses') }}</p>
      </div>

      <div v-else class="bonuses-list">
        <div
          v-for="item in items"
          :key="item.bonus_id"
          class="bonuses-item-card"
        >
          <div class="bonuses-item-head">
            <p class="bonuses-item-title">{{ item.policy_name || t('bonus.redeemable.bonus') }}</p>
            <p class="bonuses-item-amount">
              {{ t('bonus.redeemable.awardAmount', { amount: item.award_amount }) }}
            </p>
          </div>

          <div
            v-if="item.banner_html"
            class="bonus-banner"
            v-html="sanitize(item.banner_html)"
          />

          <div class="bonuses-item-footer">
            <div class="bonuses-item-code">
              <span class="bonuses-item-label">{{ t('bonus.redeemable.couponCode') }}:</span>
              <code class="bonuses-coupon-chip">{{ item.coupon_code }}</code>
            </div>
            <v-btn
              variant="flat"
              class="bonuses-btn-primary"
              :loading="redeemingId === item.bonus_id"
              :disabled="!!redeemingId || claimingCode"
              @click="handleRedeem(item)"
            >
              {{ t('bonus.redeemable.redeem') }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <BonusRedeemableHelpDialog v-model="showRedeemableHelp" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { getRedeemableBonuses, claimBonus, redeemBonus } from '@/api/wallet/wallet'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import BonusRedeemableHelpDialog from './BonusRedeemableHelpDialog.vue'
import { useWallet } from '@/composables/useWallet'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import DOMPurify from 'dompurify'

const sanitize = (html) => DOMPurify.sanitize(html)

const { t } = useI18n()
const { initializeWallet } = useWallet()
const { showError, showSuccess } = useSnackbar()

const loading = ref(true)
const items = ref([])
const showRedeemableHelp = ref(false)
const redeemingId = ref(null)
const claimingCode = ref(false)
const manualCouponCode = ref('')
const couponError = ref('')

const fetchBonuses = async () => {
  try {
    loading.value = true
    const response = await getRedeemableBonuses()
    const data = response?.data ?? response
    items.value = data?.items ?? []
  } catch (err) {
    console.error('Failed to fetch redeemable bonuses:', err)
    items.value = []
  } finally {
    loading.value = false
  }
}

const handleRedeem = async (item) => {
  try {
    redeemingId.value = item.bonus_id
    await redeemBonus(item.coupon_code, item.bonus_id)
    showSuccess(t('bonus.redeemable.redeemSuccess'))
    await initializeWallet()
    items.value = items.value.filter((i) => i.bonus_id !== item.bonus_id)
  } catch (err) {
    const msg = err?.message || err?.response?.data?.message || t('bonus.redeemable.redeemError')
    showError(msg)
  } finally {
    redeemingId.value = null
  }
}

const handleClaimCode = async () => {
  const code = manualCouponCode.value?.trim()
  if (!code) return
  couponError.value = ''
  try {
    claimingCode.value = true
    await claimBonus(code)
    showSuccess(t('bonus.redeemable.claimSuccess'))
    await initializeWallet()
    manualCouponCode.value = ''
    await fetchBonuses()
  } catch (err) {
    const msg = err?.message || err?.response?.data?.message || t('bonus.redeemable.claimError')
    couponError.value = msg
  } finally {
    claimingCode.value = false
  }
}

onMounted(() => {
  fetchBonuses()
})
</script>

<style scoped>
.bonuses-page {
  --bonuses-purple: var(--color-header-bg, #360952);
  --bonuses-purple-mid: #8a19ce;
  --bonuses-soft: #f6f0fb;
  --bonuses-border: #e5d4f3;
  --bonuses-gradient: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%);
  background: #ffffff;
  color: #111111;
}

.bonuses-help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 999px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
}

.bonuses-help-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.bonuses-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  padding: 16px 12px;
  background: #ffffff;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
}

.bonuses-coupon-field {
  width: min(100%, 260px);
  flex: 1 1 200px;
  max-width: 280px;
}

.bonuses-coupon-field :deep(.v-field) {
  background: #f5f5f5 !important;
  border-radius: 6px !important;
}

.bonuses-coupon-field :deep(.v-field__outline) {
  --v-field-border-width: 1px;
  --v-field-border-opacity: 1;
  color: #111111 !important;
}

.bonuses-coupon-field :deep(.v-field--focused .v-field__outline) {
  --v-field-border-width: 2px;
  color: var(--bonuses-purple) !important;
}

.bonuses-coupon-field :deep(.v-label) {
  color: #666666 !important;
  opacity: 1 !important;
}

.bonuses-coupon-field :deep(input) {
  color: #111111 !important;
  font-weight: 600;
}

.bonuses-coupon-field :deep(.v-messages) {
  min-height: 0;
  padding-top: 2px;
}

.bonuses-coupon-field :deep(.v-messages__message) {
  color: #b91c1c !important;
}

.bonuses-btn-primary {
  min-height: 36px !important;
  min-width: 90px !important;
  padding: 0 16px !important;
  border: 0 !important;
  border-radius: 6px !important;
  background: var(--bonuses-gradient) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em;
  text-transform: none !important;
  box-shadow: none !important;
}

.bonuses-btn-primary :deep(.v-btn__content),
.bonuses-btn-primary :deep(.v-icon) {
  color: #ffffff !important;
}

.bonuses-btn-primary:hover {
  filter: brightness(1.05);
}

.bonuses-btn-primary:disabled,
.bonuses-btn-primary.v-btn--disabled {
  opacity: 0.55 !important;
}

.bonuses-body {
  padding: 16px 12px 28px;
}

.bonuses-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.bonuses-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 16px;
  border: 1.5px dashed var(--bonuses-border);
  border-radius: 10px;
  background: var(--bonuses-soft);
  text-align: center;
}

.bonuses-empty-icon {
  color: var(--bonuses-purple-mid) !important;
  opacity: 0.9;
}

.bonuses-empty-text {
  margin: 0;
  color: #666666;
  font-size: 14px;
  font-weight: 500;
}

.bonuses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bonuses-item-card {
  padding: 14px;
  border: 1px solid var(--bonuses-border);
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(54, 9, 82, 0.06);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.bonuses-item-card:hover {
  border-color: var(--bonuses-purple-mid);
  box-shadow: 0 4px 16px rgba(54, 9, 82, 0.1);
}

.bonuses-item-head {
  margin-bottom: 12px;
}

.bonuses-item-title {
  margin: 0;
  color: var(--bonuses-purple);
  font-size: 15px;
  font-weight: 700;
}

.bonuses-item-amount {
  margin: 6px 0 0;
  color: #16a34a;
  font-size: 15px;
  font-weight: 700;
}

.bonuses-item-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--bonuses-border);
}

.bonuses-item-code {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.bonuses-item-label {
  color: #666666;
  font-size: 13px;
  font-weight: 500;
}

.bonuses-coupon-chip {
  padding: 4px 8px;
  border: 1px solid var(--bonuses-border);
  border-radius: 6px;
  background: var(--bonuses-soft);
  color: var(--bonuses-purple);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.bonus-banner {
  margin-bottom: 12px;
}

.bonus-banner :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.bonus-banner :deep(a) {
  color: var(--bonuses-purple-mid);
}

@media (max-width: 640px) {
  .bonuses-toolbar {
    padding: 12px;
  }

  .bonuses-coupon-field {
    max-width: none;
    width: 100%;
    flex: 1 1 100%;
  }

  .bonuses-btn-primary {
    width: 100%;
  }

  .bonuses-item-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
