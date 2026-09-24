import { ref, computed, onUnmounted } from 'vue';
import { calculateBetOpenTime, countdownformat } from '@/Helpers';

export function useBetOpenCountDown(eventOpenTime, betAllowBeforeTime) {
    const countdown = ref(0);
    const betAllow = ref(false);
    let interval = null;

    const updateCountdown = () => {
        countdown.value = calculateBetOpenTime(eventOpenTime.value, betAllowBeforeTime.value);

        // If countdown is 0 or less, betting is allowed (market is open or past the unlock time)
        if (countdown.value <= 0) {
            betAllow.value = true;
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        } else {
            // Countdown is still running, betting not allowed yet
            betAllow.value = false;
        }
    };

    const startCountdown = () => {
        updateCountdown();

        if (interval) clearInterval(interval);

        interval = setInterval(() => {
            updateCountdown();
        }, 1000);
    };

    const timeBeforeBet = computed(() => {
        if (betAllow.value) return "BETTING OPEN";
        return countdown.value > 0 ? `BET STARTS IN: ${countdownformat(countdown.value)}` : "Betting closed";
    });

    onUnmounted(() => {
        clearInterval(interval);
    });

    return { countdown, betAllow, timeBeforeBet, startCountdown };
}
