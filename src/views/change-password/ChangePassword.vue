<template>
  <div class="account-page change-password-page">
    <AccountPageHeader :title="t('changePassword.title')" />

    <div class="change-password-page__body">
      <v-alert v-if="isForcedPasswordChange" type="warning" variant="tonal" class="change-password-page__alert" prominent>
        <template #prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <div class="tw-font-semibold tw-mb-1">{{ t('changePassword.passwordChangeRequired') }}</div>
        <div class="tw-text-sm">{{ t('changePassword.mustChangeBeforeAccess') }}</div>
      </v-alert>

      <div class="change-password-page__hero">
        <img
          src="/zuplay/svg/key.png"
          alt=""
          class="change-password-page__key-icon"
          width="52"
          height="52"
        />
      </div>

      <form class="change-password-page__form" @submit.prevent="updateLoginPassword">
        <div class="change-password-page__field">
          <div class="change-password-page__input-wrap">
            <input
              v-model="loginPassword.currentPassword"
              :type="showLoginCurrentPassword ? 'text' : 'password'"
              class="change-password-page__input"
              :placeholder="t('changePassword.currentPassword')"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="change-password-page__toggle"
              :aria-label="showLoginCurrentPassword ? 'Hide password' : 'Show password'"
              @click="showLoginCurrentPassword = !showLoginCurrentPassword"
            >
              <img src="/svg/passwordhide.png" alt="" class="change-password-page__toggle-icon" width="28" height="28" />
            </button>
          </div>
        </div>

        <div class="change-password-page__field">
          <div class="change-password-page__input-wrap">
            <input
              v-model="loginPassword.newPassword"
              :type="showLoginNewPassword ? 'text' : 'password'"
              class="change-password-page__input"
              :placeholder="t('changePassword.newPassword')"
              autocomplete="new-password"
              required
            />
            <button
              type="button"
              class="change-password-page__toggle"
              :aria-label="showLoginNewPassword ? 'Hide password' : 'Show password'"
              @click="showLoginNewPassword = !showLoginNewPassword"
            >
              <img src="/svg/passwordhide.png" alt="" class="change-password-page__toggle-icon" width="28" height="28" />
            </button>
          </div>
        </div>

        <div class="change-password-page__field">
          <div class="change-password-page__input-wrap">
            <input
              v-model="loginPassword.confirmPassword"
              :type="showLoginConfirmPassword ? 'text' : 'password'"
              class="change-password-page__input"
              :placeholder="t('changePassword.confirmPassword')"
              autocomplete="new-password"
              required
            />
            <button
              type="button"
              class="change-password-page__toggle"
              :aria-label="showLoginConfirmPassword ? 'Hide password' : 'Show password'"
              @click="showLoginConfirmPassword = !showLoginConfirmPassword"
            >
              <img src="/svg/passwordhide.png" alt="" class="change-password-page__toggle-icon" width="28" height="28" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="change-password-page__submit"
          :disabled="loginPasswordLoading || !isLoginFormComplete"
          :aria-busy="loginPasswordLoading"
        >
          {{ loginPasswordLoading ? t('changePassword.updating') : t('changePassword.update') }}
        </button>
      </form>

      <form
        v-if="!isForcedPasswordChange"
        class="change-password-page__form change-password-page__form--wallet"
        @submit.prevent="updateWithdrawalPassword"
      >
        <p class="change-password-page__section-label">
          {{ hasWithdrawalPassword ? t('changePassword.walletPassword') : t('changePassword.setWalletPassword') }}
        </p>

        <div v-if="hasWithdrawalPassword" class="change-password-page__field">
          <div class="change-password-page__input-wrap">
            <input
              v-model="withdrawalPassword.currentPassword"
              :type="showWithdrawalCurrentPassword ? 'text' : 'password'"
              class="change-password-page__input"
              :placeholder="t('changePassword.currentWalletPassword')"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="change-password-page__toggle"
              :aria-label="showWithdrawalCurrentPassword ? 'Hide password' : 'Show password'"
              @click="showWithdrawalCurrentPassword = !showWithdrawalCurrentPassword"
            >
              <img src="/svg/passwordhide.png" alt="" class="change-password-page__toggle-icon" width="28" height="28" />
            </button>
          </div>
        </div>

        <div class="change-password-page__field">
          <div class="change-password-page__input-wrap">
            <input
              v-model="withdrawalPassword.newPassword"
              :type="showWithdrawalNewPassword ? 'text' : 'password'"
              class="change-password-page__input"
              :placeholder="t('changePassword.walletPassword')"
              autocomplete="new-password"
              required
            />
            <button
              type="button"
              class="change-password-page__toggle"
              :aria-label="showWithdrawalNewPassword ? 'Hide password' : 'Show password'"
              @click="showWithdrawalNewPassword = !showWithdrawalNewPassword"
            >
              <img src="/svg/passwordhide.png" alt="" class="change-password-page__toggle-icon" width="28" height="28" />
            </button>
          </div>
        </div>

        <div class="change-password-page__field">
          <div class="change-password-page__input-wrap">
            <input
              v-model="withdrawalPassword.confirmPassword"
              :type="showWithdrawalConfirmPassword ? 'text' : 'password'"
              class="change-password-page__input"
              :placeholder="t('changePassword.confirmPassword')"
              autocomplete="new-password"
              required
            />
            <button
              type="button"
              class="change-password-page__toggle"
              :aria-label="showWithdrawalConfirmPassword ? 'Hide password' : 'Show password'"
              @click="showWithdrawalConfirmPassword = !showWithdrawalConfirmPassword"
            >
              <img src="/svg/passwordhide.png" alt="" class="change-password-page__toggle-icon" width="28" height="28" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="change-password-page__submit"
          :disabled="withdrawalPasswordLoading || !isWithdrawalFormComplete"
          :aria-busy="withdrawalPasswordLoading"
        >
          {{
            withdrawalPasswordLoading
              ? (hasWithdrawalPassword ? t('changePassword.updating') : t('changePassword.setting'))
              : (hasWithdrawalPassword ? t('changePassword.update') : t('changePassword.set'))
          }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import { changePassword } from '../../api/user/profile.js'
import { useAuthStore } from '../../stores/auth.js'
import { useSnackbar } from '../../composables/useSnackbar/useSnackbar.js'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError } = useSnackbar()

const loginPasswordLoading = ref(false)
const withdrawalPasswordLoading = ref(false)
const hasWithdrawalPassword = ref(false)

const showLoginCurrentPassword = ref(false)
const showLoginNewPassword = ref(false)
const showLoginConfirmPassword = ref(false)
const showWithdrawalCurrentPassword = ref(false)
const showWithdrawalNewPassword = ref(false)
const showWithdrawalConfirmPassword = ref(false)

const loginPassword = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const withdrawalPassword = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isForcedPasswordChange = computed(() => {
  return authStore.currentUser?.require_password_change === true
})

const isLoginFormComplete = computed(() => {
  const form = loginPassword.value
  return Boolean(form.currentPassword && form.newPassword && form.confirmPassword)
})

const isWithdrawalFormComplete = computed(() => {
  const form = withdrawalPassword.value
  if (hasWithdrawalPassword.value && !form.currentPassword) return false
  return Boolean(form.newPassword && form.confirmPassword)
})

onMounted(async () => {
  try {
    hasWithdrawalPassword.value = authStore.currentUser?.is_withdrawal ?? false
  } catch (error) {
    console.error('Error checking withdrawal password status:', error)
  }
})

const validatePasswords = (current, newPassword, confirm) => {
  if (newPassword !== confirm) {
    throw new Error(t('changePassword.passwordMismatch'))
  }

  if (newPassword.length < 8) {
    throw new Error(t('changePassword.passwordTooShort'))
  }

  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
    throw new Error(t('changePassword.passwordNeedsLettersNumbers'))
  }

  if (current && current === newPassword) {
    throw new Error(t('changePassword.passwordDifferent'))
  }
}

const updateLoginPassword = async () => {
  try {
    loginPasswordLoading.value = true

    validatePasswords(
      loginPassword.value.currentPassword,
      loginPassword.value.newPassword,
      loginPassword.value.confirmPassword
    )

    const response = await changePassword({
      type: 'password',
      old_password: loginPassword.value.currentPassword,
      password: loginPassword.value.newPassword,
      password_confirmation: loginPassword.value.confirmPassword
    })

    if (response.success) {
      showSuccess(t('changePassword.loginPasswordUpdated'))

      if (authStore.user) {
        authStore.setUser({
          ...authStore.user,
          require_password_change: false
        })
      }

      loginPassword.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }

      const rawRedirect = router.currentRoute.value.query.redirect || '/'
      const redirectPath = (typeof rawRedirect === 'string' && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//'))
        ? rawRedirect
        : '/'
      router.push(redirectPath)
    } else {
      throw new Error(response.message || t('changePassword.passwordError'))
    }
  } catch (error) {
    showError(error.message || t('changePassword.passwordError'))
  } finally {
    loginPasswordLoading.value = false
  }
}

const updateWithdrawalPassword = async () => {
  try {
    withdrawalPasswordLoading.value = true

    validatePasswords(
      hasWithdrawalPassword.value ? withdrawalPassword.value.currentPassword : null,
      withdrawalPassword.value.newPassword,
      withdrawalPassword.value.confirmPassword
    )

    const response = await changePassword({
      type: 'withdrawal_password',
      old_password: hasWithdrawalPassword.value ? withdrawalPassword.value.currentPassword : undefined,
      password: withdrawalPassword.value.newPassword,
      password_confirmation: withdrawalPassword.value.confirmPassword
    })

    if (response.success) {
      const message = hasWithdrawalPassword.value
        ? t('changePassword.walletPasswordUpdated')
        : t('changePassword.walletPasswordSet')
      showSuccess(message)

      if (!hasWithdrawalPassword.value) {
        hasWithdrawalPassword.value = true
      }

      withdrawalPassword.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    } else {
      throw new Error(response.message || t('changePassword.passwordError'))
    }
  } catch (error) {
    showError(error.message || t('changePassword.passwordError'))
  } finally {
    withdrawalPasswordLoading.value = false
  }
}
</script>
