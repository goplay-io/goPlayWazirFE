import { getApiClient } from "../axios";
import { useAuthStore } from "../../stores/auth";

const api = getApiClient("event");

// POST /bet/void
export const voidBet = (betId) => api.post("/bet/void", { bet_id: betId });

export const speedCash = (marketId) =>
  api.post("/bet/speed-cash", { market_id: String(marketId) });

function unwrapExposureList(response) {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

// GET /events/exposure/summary — per-event exposure (client My Markets dialog)
export const fetchExposureSummary = async (queryParams = {}) => {
  try {
    const response = await api.get("/events/exposure/summary", {
      params: queryParams,
    });
    return unwrapExposureList(response);
  } catch (error) {
    console.error("Failed to fetch exposure summary:", error);
    throw error;
  }
};

/** @deprecated Use fetchExposureSummary for client exposure UI */
export const fetchExposure = fetchExposureSummary;

// GET /events/bet-details/:event_id - Get bet history by event (client-facing)
export const fetchBetHistory = async (event_id, queryParams = {}) => {
  try {
    // Check if user is demo - don't make API call for demo users
    // Block API calls for all demo users (both preview and full demo)
    const authStore = useAuthStore();
    if (authStore.isDemoUser) {
      // Return empty data for demo users without making API call
      return {
        bets: [],
        outcomes: {},
      };
    }

    const response = await api.get(`/events/bet-details/${event_id}`, {
      params: queryParams,
    });
    const payload = response?.data || response;
    // Return both bets and outcomes
    return {
      bets: payload?.data?.bets ?? payload?.bets ?? [],
      outcomes: payload?.data?.outcomes ?? payload?.outcomes ?? {},
    };
  } catch (error) {
    console.error("Failed to fetch bet history:", error);
    throw error;
  }
};

// GET /big-wins - Get latest big wins
export const fetchBigWins = async (queryParams = {}) => {
  try {
    const response = await api.get("/big-wins", { params: queryParams });
    const payload = response?.data || response;
    return {
      bigWins: payload?.data?.bigWins ?? payload?.bigWins ?? [],
    };
  } catch (error) {
    console.error("Failed to fetch big wins:", error);
    throw error;
  }
};
