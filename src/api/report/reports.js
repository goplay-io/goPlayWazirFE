import { getApiClient } from "../axios";

const api = getApiClient("report");

// GET /bets/live
export const getLiveBets = (queryParams = {}) =>
  api.get("/bets/live", { params: queryParams });

// GET /bets/pending
export const getPendingBets = (queryParams = {}) =>
  api.get("/bets/pending", { params: queryParams });

// GET /bet/unsettled - Get unsettled bets (non-management)
export const getUnsettledBets = (queryParams = {}) =>
  api.get("/bet/unsettled", { params: queryParams });

// GET /bet/history - Get user bet history (non-management)
export const getBetHistory = (queryParams = {}) =>
  api.get("/bet/history", { params: queryParams });

// GET /bet/history/management - Get bet history management (master)
export const getBetHistoryManagement = (params = {}) =>
  api.get("/bet/history/management", { params });

// GET /bet/settled/admin - Get settled bet admin (no user filter, no recursive users)
export const getSettledBetAdmin = (params = {}) =>
  api.get("/bet/settled/admin", { params });

// GET /transaction/bet/history - Get bets by transaction ID
export const getBetsByTransaction = (transactionId, filters = {}) => {
  // Remove date filters for transaction bet history
  // eslint-disable-next-line no-unused-vars
  const { start_date, end_date, ...filteredFilters } = filters;

  return api.get("/transaction/bet/history", {
    params: {
      transaction_id: transactionId,
      ...filteredFilters,
    },
  });
};

// POST /bets/history/event/:event_id - Get bet history by event ID
export const getBetHistoryByEventId = (eventId, filters = {}) => {
  const {
    start_date,
    end_date,
    page,
    limit,
    event_type_id,
    min_stake,
    max_stake,
  } = filters;

  // Build payload, only including defined values
  const payload = {
    start_date,
    end_date,
    page,
    limit,
  };

  // Add optional filters only if they have values
  if (event_type_id != null) payload.event_type_id = event_type_id;
  if (min_stake != null) payload.min_stake = min_stake;
  if (max_stake != null) payload.max_stake = max_stake;

  return api.post(`/bets/history/event/${eventId}`, payload);
};

// POST /bets/history/market/:market_id - Get bet history by market ID
export const getBetHistoryByMarket = (marketId, filters = {}) => {
  const {
    start_date,
    end_date,
    page,
    limit,
    event_type_id,
    min_stake,
    max_stake,
  } = filters;

  // Build payload, only including defined values
  const payload = {
    start_date,
    end_date,
    page,
    limit,
  };

  // Add optional filters only if they have values
  if (event_type_id != null) payload.event_type_id = event_type_id;
  if (min_stake != null) payload.min_stake = min_stake;
  if (max_stake != null) payload.max_stake = max_stake;

  return api.post(`/bets/history/market/${marketId}`, payload);
};

// POST /account-statement - Get account statement (non-management)
export const getAccountStatement = (params = {}) =>
  api.post("/account-statement", params);

// POST /account-statement/v2 - Grouped by market, SUM(profit_loss), excludes pending bets
export const getAccountStatementV2 = (params = {}) =>
  api.post("/account-statement/v2", params);

// POST /account-statement/v3 - Grouped by market with passbook-style running balance
export const getAccountStatementV3 = (params = {}) =>
  api.post("/account-statement/v3", params);

// POST /account-statement/management - Get account statement (management/master view)
export const getAccountStatementManagement = (params = {}) =>
  api.post("/account-statement/management", params);

// GET /pnl - client/user profit & loss
export const getProfitLoss = (queryParams = {}) =>
  api.get("/pnl", { params: queryParams });

// POST /pnl/management - master profit & loss (management view)
// Mirrors bettingMaster getMasterProfitLoss
export const getMasterProfitLoss = (params = {}) =>
  api.post("/pnl/management", params);

// POST /settlement/report - Get settlement report (master)
export const getSettlementReport = (params = {}) =>
  api.post("/settlement/report", params);

// GET /settlement/detail - Get settlement data (summary)
export const getSettlementData = (queryParams = {}) =>
  api.get("/settlement/detail", { params: queryParams });

// POST /sports/pnl - Get sports profit and loss report
export const getSportsProfitLoss = (params = {}) =>
  api.post("/sports/pnl", params);

// POST /weekly - Get weekly report
export const getWeeklyReport = (params = {}) => api.post("/weekly", params);

// POST /top/clients - Get top clients
export const getTopClients = (params = {}) => api.post("/top/clients", params);

// GET /report/balance/sheet - Get balance sheet data
export const getBalanceSheet = (queryParams = {}) =>
  api.get("/report/balance/sheet", { params: queryParams });

// POST /export - Export reports to Excel
export const exportReport = async (params = {}) => {
  const response = await api.post("/export", params, {
    responseType: "blob",
  });

  // Return in format expected by handleFileDownload (same as master)
  // Axios response structure: { data, headers, status, statusText, config }
  return response;
};

// GET /constants - Get constants
export const getConstants = (queryParams = {}) =>
  api.get("/constants", { params: queryParams });

// GET /pnl/event - Get event-level profit & loss for a specific user
// Mirrors bettingMaster getEventProfitLoss
export const getEventProfitLoss = (eventId, userId, filters = {}) => {
  return api.get("/pnl/event", {
    params: {
      event_id: eventId,
      user_id: userId,
      filters,
    },
  });
};

// GET /bet/detail - Get bet details for a market & user
// Mirrors bettingMaster getBetDetails
export const getBetDetails = (marketId, userId, filters = {}) => {
  return api.get("/bet/detail", {
    params: {
      user_id: userId,
      market_id: marketId,
      filters,
    },
  });
};

// GET /report/bets/market-or-round - sports by market_id, casino by game_id + bet_date
export const getBetsByMarketorRound = ({ marketId, gameId, betDate } = {}) => {
  return api.get("/bets/market-or-round", {
    params: {
      market_id: marketId || undefined,
      game_id: gameId || undefined,
      bet_date: betDate || undefined,
    },
  });
};
