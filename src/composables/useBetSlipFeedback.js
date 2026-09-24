import { ref, watch, onUnmounted } from 'vue';

const FEEDBACK_DISMISS_MS = {
  success: 4000,
  error: 5000,
};

/**
 * Keeps bet slip toast + inline banner in sync for success/error feedback.
 */
export function useBetSlipFeedback({
  betStatus,
  getBetError,
  getBetRunnerId,
  showSuccess,
  showError,
  t,
}) {
  const inlineMessage = ref(null);
  let dismissTimer = null;

  const clearInlineMessage = () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    inlineMessage.value = null;
  };

  const showInlineMessage = (type, message) => {
    inlineMessage.value = { type, message };

    if (dismissTimer) {
      clearTimeout(dismissTimer);
    }

    dismissTimer = setTimeout(() => {
      inlineMessage.value = null;
      dismissTimer = null;
    }, FEEDBACK_DISMISS_MS[type] ?? 4000);
  };

  watch(betStatus, (status) => {
    if (status === 'processing') {
      clearInlineMessage();
      return;
    }

    if (status === 'success') {
      const message = t('sports.home.betPlaced');
      showInlineMessage('success', message);
      showSuccess(message);
      return;
    }

    if (status === 'failed') {
      const message = getBetError() || t('sports.home.betFailed');
      showInlineMessage('error', message);
      showError(message);
    }
  });

  watch(getBetError, (errorMessage, previousMessage) => {
    if (!errorMessage || errorMessage === previousMessage || betStatus.value === 'processing') {
      return;
    }

    if (betStatus.value === 'failed') {
      return;
    }

    showInlineMessage('error', errorMessage);
  });

  watch(getBetRunnerId, () => {
    clearInlineMessage();
  });

  onUnmounted(clearInlineMessage);

  return {
    inlineMessage,
    clearInlineMessage,
  };
}
