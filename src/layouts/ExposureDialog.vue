<template>
    <v-dialog
        v-model="internalModel"
        :fullscreen="false"
        :max-width="isMobile ? undefined : 720"
        :width="isMobile ? '92%' : undefined"
        transition="dialog-top-transition"
        content-class="exposure-dialog-overlay"
        scrollable
        no-click-animation
    >
        <v-card
            class="exposure-dialog"
            :class="{ 'exposure-dialog--mobile': isMobile }"
        >
            <template v-if="isMobile">
                <div class="exposure-dialog__header">
                    <div class="exposure-dialog__header-left">
                        <span class="exposure-dialog__title">Exposure Details</span>
                        <button
                            type="button"
                            class="exposure-dialog__icon-btn"
                            aria-label="Refresh"
                            :disabled="loading"
                            @click="fetchExposureData"
                        >
                            <v-icon size="18" :class="{ 'exposure-dialog__refresh--spin': loading }">
                                mdi-refresh
                            </v-icon>
                        </button>
                    </div>
                    <button
                        type="button"
                        class="exposure-dialog__icon-btn"
                        aria-label="Close"
                        @click="closeDialog"
                    >
                        <v-icon size="20">mdi-close</v-icon>
                    </button>
                </div>
            </template>

            <button
                v-else
                type="button"
                class="exposure-dialog__header exposure-dialog__header--sticky"
                aria-label="Exposure header"
            >
                <div class="exposure-dialog__header-left exposure-dialog__header-left--sticky">
                    <span class="exposure-dialog__title exposure-dialog__title--sticky">Exposure Details</span>
                    <button
                        type="button"
                        class="exposure-dialog__icon-btn exposure-dialog__icon-btn--sticky"
                        aria-label="Refresh"
                        :disabled="loading"
                        @click="fetchExposureData"
                    >
                        <v-icon size="18" :class="{ 'exposure-dialog__refresh--spin': loading }">
                            mdi-refresh
                        </v-icon>
                    </button>
                </div>
            </button>

            <button
                v-if="!isMobile"
                type="button"
                class="exposure-dialog__close"
                aria-label="Close"
                @click="closeDialog"
            >
                <v-icon size="20">mdi-close</v-icon>
            </button>

            <div
                class="exposure-dialog__body"
                :class="{ 'exposure-dialog__body--empty': isMobile && !loading && !tableData.length }"
            >
                <template v-if="loading">
                    <v-skeleton-loader
                        v-for="n in 5"
                        :key="n"
                        type="table-row"
                        class="exposure-dialog__skeleton"
                    />
                </template>

                <template v-else-if="isMobile && !tableData.length">
                    <p class="exposure-dialog__empty-message">No Data Available</p>
                </template>

                <template v-else>
                    <div class="exposure-dialog__table-wrap">
                        <table class="exposure-dialog__table">
                            <thead>
                                <tr>
                                    <th class="exposure-dialog__th exposure-dialog__th--type">
                                        {{ t('components.exposureDialog.eventType') }}
                                    </th>
                                    <th class="exposure-dialog__th exposure-dialog__th--name">
                                        {{ t('components.exposureDialog.eventName') }}
                                    </th>
                                    <th class="exposure-dialog__th exposure-dialog__th--expose">
                                        {{ t('components.exposureDialog.expose') }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="row in tableData"
                                    :key="row.event_id ?? row.eventId"
                                    class="exposure-dialog__row"
                                    @click="goToEvent(row.event_id ?? row.eventId)"
                                >
                                    <td class="exposure-dialog__td exposure-dialog__td--type">
                                        {{ displayEventType(row) }}
                                    </td>
                                    <td class="exposure-dialog__td exposure-dialog__td--name">
                                        <span class="exposure-dialog__link">{{ displayEventName(row) }}</span>
                                    </td>
                                    <td class="exposure-dialog__td exposure-dialog__td--expose">
                                        {{ displayExpose(row) }}
                                    </td>
                                </tr>
                                <tr v-if="!tableData.length" class="exposure-dialog__empty-row">
                                    <td class="exposure-dialog__empty-cell" colspan="3">
                                        No Data To Display
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { fetchExposureSummary } from '@/api/event/bet.js';
import { useRouter } from 'vue-router';
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useI18n } from 'vue-i18n'
import { useEventTypes } from '@/composables/useEventTypes'
import { useEventsStore } from '@/stores/events/events'
import useDevices from '@/composables/useDevices'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    }
});
const { showError } = useSnackbar()
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n()
const { isMobile } = useDevices()
const { getEventTypeName } = useEventTypes()
const eventsStore = useEventsStore()

const internalModel = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const closeDialog = () => {
    internalModel.value = false;
};

const tableData = ref([]);
const loading = ref(false);
const error = ref(null);

function resolveEventTitle(eventId) {
    if (eventId == null || eventId === '') return null;
    const id = Number(eventId);
    const event = eventsStore.allEvents.find((e) =>
        Number(e.event_id) === id || Number(e.id) === id
    );
    return event?.name ?? event?.event_name ?? null;
}

function displayEventType(row) {
    const fromApi = row?.event_type ?? row?.eventType ?? row?.event_type_name;
    if (fromApi) return fromApi;

    const typeId = row?.event_type_id ?? row?.eventTypeId;
    if (typeId != null) {
        return getEventTypeName(Number(typeId)) ?? `Type ${typeId}`;
    }

    return '—';
}

function displayEventName(row) {
    return (
        row?.event_name ??
        row?.eventName ??
        row?.name ??
        resolveEventTitle(row?.event_id ?? row?.eventId) ??
        '—'
    );
}

function displayExpose(row) {
    const value = row?.expose ?? row?.exposure;
    if (value === null || value === undefined || value === '') return '—';
    return value;
}

const fetchExposureData = async () => {
    loading.value = true;
    error.value = null;
    try {
        await Promise.all([
            eventsStore.fetchEventTypes(),
            eventsStore.fetchAllEvents(),
        ]);
        const rows = await fetchExposureSummary();
        tableData.value = Array.isArray(rows) ? rows : [];
    } catch (err) {
        error.value = err.message || t('components.exposureDialog.fetchError');
        showError(error.value);
        tableData.value = [];
    } finally {
        loading.value = false;
    }
};

watch(
    () => internalModel.value,
    (newVal, oldVal) => {
        if (newVal && !oldVal) {
            fetchExposureData();
        }
    }
);

const router = useRouter();

function goToEvent(event_id) {
    if (event_id) {
        internalModel.value = false;
        router.push(`/sports/bet/${event_id}`);
    }
}
</script>

<style scoped>
.exposure-dialog {
    position: relative;
    background: #ffffff !important;
    border: 1px solid var(--color-header-bg, #360952);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(54, 9, 82, 0.28);
    overflow: hidden;
    width: 100%;
    color: #111111 !important;
}

.exposure-dialog--mobile {
    max-height: min(45vh, 16rem);
    min-height: 0;
    height: auto;
    display: flex;
    flex-direction: column;
    border: none;
    border-radius: 8px;
    background: #ffffff !important;
}

.exposure-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 12px 14px;
    background: var(--color-header-bg, #360952);
    color: #ffffff;
}

.exposure-dialog__header--sticky {
    /* Match the reference sticky dialog header (desktop). */
    position: sticky;
    top: 0;
    z-index: 50;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    padding: 8px;
    justify-content: flex-start;
}

.exposure-dialog__header-left--sticky {
    gap: 8px;
}

.exposure-dialog__title--sticky {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
}

.exposure-dialog__icon-btn--sticky {
    width: 26px;
    height: 26px;
}

.exposure-dialog__header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.exposure-dialog__title {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
    color: #ffffff;
    white-space: nowrap;
}

.exposure-dialog__icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    color: #ffffff !important;
    cursor: pointer;
    line-height: 1;
    flex-shrink: 0;
}

.exposure-dialog__icon-btn:disabled {
    opacity: 0.7;
    cursor: default;
}

.exposure-dialog__icon-btn :deep(.v-icon) {
    color: #ffffff !important;
}

.exposure-dialog__refresh--spin {
    animation: exposure-dialog-spin 0.8s linear infinite;
}

@keyframes exposure-dialog-spin {
    to {
        transform: rotate(360deg);
    }
}

.exposure-dialog__close {
    position: absolute;
    top: 8px;
    right: 10px;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-header-bg, #360952) !important;
    -webkit-text-fill-color: var(--color-header-bg, #360952) !important;
    cursor: pointer;
    line-height: 1;
}

.exposure-dialog__close :deep(.v-icon) {
    color: var(--color-header-bg, #360952) !important;
}

.exposure-dialog__close:hover {
    opacity: 0.75;
    color: #8a19ce !important;
}

.exposure-dialog__close:hover :deep(.v-icon) {
    color: #8a19ce !important;
}

.exposure-dialog__body {
    padding: 16px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

.exposure-dialog--mobile .exposure-dialog__body {
    padding: 0;
}

.exposure-dialog__body--empty {
    align-items: center;
    justify-content: center;
    min-height: 7rem;
    background: #ffffff;
}

.exposure-dialog__empty-message {
    margin: 0;
    padding: 28px 16px;
    color: #9ea3ae;
    font-size: 14px;
    font-weight: 400;
    text-align: center;
    background: #ffffff;
}

.exposure-dialog__table-wrap {
    overflow: auto;
    flex: 1;
    min-height: 0;
    border: none;
    background: #ffffff;
    -webkit-overflow-scrolling: touch;
}

.exposure-dialog--mobile .exposure-dialog__table-wrap {
    padding: 0;
}

.exposure-dialog__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 13px;
    line-height: 1.35;
}

.exposure-dialog__th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 10px 12px;
    background: var(--color-header-bg, #360952) !important;
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: center;
    vertical-align: middle;
    border-right: 1px solid rgba(255, 255, 255, 0.85);
    white-space: nowrap;
    height: 38px;
}

.exposure-dialog__th:last-child {
    border-right: none;
}

.exposure-dialog__th--type {
    width: 24%;
    text-align: center;
}

.exposure-dialog__th--name {
    width: 52%;
    text-align: center;
}

.exposure-dialog__th--expose {
    width: 24%;
    text-align: center;
}

.exposure-dialog__row {
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.exposure-dialog__row:hover .exposure-dialog__td {
    background: #f9fafb;
}

.exposure-dialog__td {
    padding: 10px 12px;
    color: #111111 !important;
    -webkit-text-fill-color: #111111 !important;
    vertical-align: middle;
    border-bottom: 1px solid #e5e7eb;
    border-right: 1px solid #e5e7eb;
    background: #ffffff;
    word-break: break-word;
    font-size: 0.78rem;
}

.exposure-dialog__td:last-child {
    border-right: none;
}

.exposure-dialog__td--type {
    font-weight: 500;
}

.exposure-dialog__td--name {
    text-align: left;
}

.exposure-dialog__td--expose {
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.exposure-dialog__link {
    color: var(--color-header-bg, #360952) !important;
    -webkit-text-fill-color: var(--color-header-bg, #360952) !important;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.exposure-dialog__row:hover .exposure-dialog__link {
    color: #8a19ce !important;
    -webkit-text-fill-color: #8a19ce !important;
}

.exposure-dialog__empty-cell {
    padding: 12px 12px;
    color: #6b7280 !important;
    -webkit-text-fill-color: #6b7280 !important;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-top: 1px solid #d1d5db;
    text-align: left;
    font-size: 13px;
    font-weight: 500;
}

.exposure-dialog__skeleton {
    margin: 8px 12px;
    background: transparent !important;
}

.exposure-dialog__skeleton :deep(.v-skeleton-loader__bone) {
    background: rgba(54, 9, 82, 0.12) !important;
}

@media (max-width: 768px) {
    .exposure-dialog__th,
    .exposure-dialog__td {
        padding: 8px 6px;
    }

    .exposure-dialog__th {
        font-size: 12px;
        letter-spacing: 0.02em;
    }

    .exposure-dialog__td {
        font-size: 11px;
    }

    .exposure-dialog__th--type {
        width: 35%;
    }

    .exposure-dialog__th--name {
        width: 50%;
    }

    .exposure-dialog__th--expose {
        width: 28%;
    }
}
</style>
