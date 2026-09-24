import { useWalletStore } from './stores/wallet.js'
import appConstants from './constants/appConstants.js'

export const countdownformat = (countdown) => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export const calculateBetOpenTime = (event_open_time, bet_allow_before_time) => {
    const eventTime = new Date(event_open_time).getTime();
    const currentTime = new Date().getTime();
    // Default to constant value if bet_allow_before_time is not provided
    const minutesBeforeTime = bet_allow_before_time ?? appConstants.DEFAULT_BET_ALLOW_BEFORE_TIME_MINUTES;
    const betAllowTime = minutesBeforeTime * 60 * 1000;
    return Math.max(0, Math.floor((eventTime - currentTime - betAllowTime) / 1000));
}
