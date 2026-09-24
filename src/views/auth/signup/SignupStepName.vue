<template>
  <div>
    <div class="signup-step2-content">
      <div class="signup-username-phone-row">
        <div class="login-field-wrapper">
          <label class="login-field-label">
            <v-icon size="16" class="tw-mr-1">mdi-account-outline</v-icon>
            {{ t('auth.signup.firstName') }}
          </label>
          <v-text-field
            :model-value="firstName"
            @update:model-value="$emit('update:firstName', $event)"
            variant="outlined"
            :placeholder="t('auth.signup.enterFirstName')"
            class="login-input-modern"
            :rules="[rules.required, rules.nameLength]"
            hide-details="auto"
            density="comfortable"
          />
        </div>
        <div class="login-field-wrapper">
          <label class="login-field-label">
            <v-icon size="16" class="tw-mr-1">mdi-account-outline</v-icon>
            {{ t('auth.signup.lastName') }}
          </label>
          <v-text-field
            :model-value="lastName"
            @update:model-value="$emit('update:lastName', $event)"
            variant="outlined"
            :placeholder="t('auth.signup.enterLastName')"
            class="login-input-modern"
            :rules="[rules.required, rules.nameLength]"
            hide-details="auto"
            density="comfortable"
          />
        </div>
      </div>
    </div>
    <div class="signup-step-actions signup-step2-actions">
      <v-btn variant="outlined" class="signup-btn-back" @click="$emit('back')">
        <v-icon start size="18">mdi-arrow-left</v-icon>
        {{ t('common.back') }}
      </v-btn>
      <div class="tw-flex-1"></div>
      <v-btn class="signup-btn-next" @click="$emit('next')">
        {{ t('common.next') }}
        <v-icon end size="18">mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  campaignId: { type: String, default: '' },
  rules: { type: Object, required: true },
});

defineEmits(['update:firstName', 'update:lastName', 'back', 'next']);

const { t } = useI18n();
const route = useRoute();

const resolvedCampaignId = computed(() => {
  const byProp = String(props.campaignId || '').trim();
  if (byProp) return byProp;

  // Fallback for URL variants used across links.
  return String(
    route.query?.campaign_id ||
    route.query?.campaignId ||
    route.query?.campign_id ||
    ''
  ).trim();
});
</script>
