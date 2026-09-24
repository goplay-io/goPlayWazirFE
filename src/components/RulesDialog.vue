<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n'
import rulesData from '@/data/rules.json';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    sportName: { type: String, required: true }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const normalizedSportName = computed(() => (props.sportName || '').toLowerCase().trim());

const sport = computed(() => {
    if (!Array.isArray(rulesData?.sports)) return null;
    return rulesData.sports.find(s => (s?.sport_name || '').toLowerCase().trim() === normalizedSportName.value) || null;
});

const sportRules = computed(() => Array.isArray(sport.value?.rules) ? sport.value.rules : []);

const { t } = useI18n()

function getRuleClass(color) {
    if (!color) return ''
    if (color.startsWith('tw-')) return color
    if (color.startsWith('text-')) return `tw-${color}`
    return color
}

const isFancyMarket = computed(() => normalizedSportName.value === 'fancy markets');

const titleText = computed(() => t('components.rulesDialog.rules'));

function close() {
    isOpen.value = false;
}
</script>

<template>
    <v-dialog
        v-model="isOpen"
        scrollable
        class="rules-dialog-shell"
        content-class="rules-dialog-overlay-content"
    >
        <div class="rules-dialog" role="document">
            <header class="rules-dialog__header">
                <span class="rules-dialog__title">{{ titleText }}</span>
                <button
                    type="button"
                    class="rules-dialog__close"
                    :aria-label="t('components.globalSnackbar.close')"
                    @click="close"
                >
                    <img
                        src="/zuplay/svg/close-icon-white.png"
                        alt=""
                        class="rules-dialog__close-icon"
                        width="16"
                        height="16"
                    />
                </button>
            </header>

            <div class="rules-dialog__body">
                <div v-if="sportRules.length" class="rules-dialog__content">
                    <ul class="rules-dialog__list">
                        <li
                            v-for="rule in sportRules"
                            :key="rule.id"
                            class="rules-dialog__item"
                            :class="getRuleClass(rule.color)"
                        >
                            <template v-if="isFancyMarket">{{ rule.id }}. </template>{{ rule.name }}
                        </li>
                    </ul>
                </div>
                <div v-else class="rules-dialog__empty">
                    {{ t('components.rulesDialog.noRules') }}
                </div>
            </div>
        </div>
    </v-dialog>
</template>

<style scoped>
/* Match reference: centered modal, p-4 inset, max-h 700px, purple header, white body */
.rules-dialog-shell :deep(.v-overlay__content.rules-dialog-overlay-content),
.rules-dialog-shell :deep(.v-overlay__content) {
    margin: 0 !important;
    padding: 16px !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
}

.rules-dialog {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1280px;
    height: min(100%, 700px);
    max-height: 700px;
    overflow: hidden;
    border-radius: 8px;
    background: #ffffff;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.rules-dialog__header {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-height: 42px;
    padding: 8px;
    border-radius: 4px 4px 0 0;
    background: #360952;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    position: sticky;
    top: 0;
    z-index: 1;
}

.rules-dialog__title {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    text-transform: capitalize;
}

.rules-dialog__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 20px;
    margin-left: auto;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
}

.rules-dialog__close-icon {
    display: block;
    width: 16px;
    height: 16px;
    margin-top: 4px;
    margin-right: 8px;
    object-fit: contain;
}

.rules-dialog__body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: #ffffff;
    border-radius: 0 0 4px 4px;
}

.rules-dialog__content {
    padding: 0 16px 40px;
    margin: 0 0 20px;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #101010;
}

.rules-dialog__list {
    margin: 20px 0 0;
    padding: 0;
    list-style: none;
}

.rules-dialog__item {
    padding: 0 20px;
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #101010;
    white-space: pre-line;
    word-break: break-word;
}

.rules-dialog__empty {
    padding: 20px 16px 40px;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #101010;
}

@media (min-width: 768px) {
    .rules-dialog__content {
        margin-bottom: 4px;
    }
}
</style>
