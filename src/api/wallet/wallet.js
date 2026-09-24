import { getApiClient } from '../axios';


const api = getApiClient('wallet');

const buildQueryString = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
};

// Get chip information - matches backend: GET /wallet/chip (no user_id needed, gets logged-in user's balance)
export const getChipInfo = (queryParams = {}) => {
  return api.get('/wallet/chip', { params: queryParams });
};

// Get wallet data for wallet page - matches backend: GET /wallet/data
export const getWalletData = (queryParams = {}) => {
  return api.get('/wallet/data', { params: queryParams });
};

// List and fetch wallet info
export const getWallet = (id,queryParams = {}) =>
  api.get(`/wallet/hierarchy/${id}${buildQueryString(queryParams)}`);

// Get hierarchy transfer data - matches backend: GET /wallet/hierarchy/:id?
export const getHierarchyTransferData = (userId = null, queryParams = {}) => {
  const url = userId ? `/wallet/hierarchy/${userId}` : '/wallet/hierarchy';
  return api.get(url, { params: queryParams });
};

// Send chips (deposit/withdrawal) - matches backend: POST /wallet/send
export const sendChips = (depositData, queryParams = {}) =>
  api.post('/wallet/send', depositData, { params: queryParams });

// Get chip summary - matches backend: GET /wallet/summary
export const getChipSummary = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `/wallet/summary?${queryString}` : '/wallet/summary';
  return api.get(url);
};

// Process chip settlement - matches backend: POST /wallet/settlement
export const processChipSettlement = (data, queryParams = {}) =>
  api.post('/wallet/settlement', data, { params: queryParams });

// Wallet transfer/request functions (deposit/withdrawal)
export const submitRequest = (params = {}) =>
  api.post('/wallet/transfer', params);

export const getWithdrawHistory = (params = {}) => {
  const queryParams = { ...params, type: 'withdrawal' };
  return api.get('/wallet/transfer', { params: queryParams });
};

export const getDepositHistory = (params = {}) => {
  const queryParams = { ...params, type: 'deposit' };
  return api.get('/wallet/transfer', { params: queryParams });
};

export const createDepositRequest = (depositData) => {
  const requestData = { type: 'deposit', ...depositData };

  // If a receipt file is provided, send multipart/form-data
  if (requestData.receiptFile) {
    const formData = new FormData();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'receiptFile') {
        formData.append('receipt', value);
      } else {
        formData.append(key, value);
      }
    });
    return api.post('/wallet/transfer', formData);
  }

  return api.post('/wallet/transfer', requestData);
};

export const createWithdrawalRequest = (withdrawalData) => {
  const requestData = { type: 'withdrawal', ...withdrawalData };
  return api.post('/wallet/transfer', requestData);
};

// Cancel a pending deposit or withdrawal request
export const cancelRequest = (requestId) =>
  api.delete(`/wallet/transfer/${requestId}`);

// Get WhatsApp number (current user or optional user_id for child)
export const getWhatsappNumber = (queryParams = {}) =>
  api.get('/wallet/whatsapp-number', { params: queryParams });

// Get parent's default active WhatsApp number (uses logged-in user's parent_id server-side)
export const getParentWhatsappNumber = () =>
  api.get('/wallet/whatsapp-number/parent');

// Get deposit turnover records for the logged-in user with optional filters & pagination
// Backend route: GET /wallet/deposit-turnovers
export const getDepositTurnovers = (params = {}) =>
  api.get('/wallet/deposit-turnovers', { params });

// Get turnover history records for the logged-in user with optional filters & pagination
// Backend route: GET /wallet/turnover-history
export const getTurnoverHistory = (params = {}) =>
  api.get('/wallet/turnover-history', { params });
// Get bonus statement for logged-in user (paginated)
export const getBonusStatement = (params = {}) =>
  api.get('/wallet/bonus/statement', { params });

// Get bonus rules content for client
export const getBonusRules = () =>
  api.get('/wallet/bonus/rules');

// Get redeemable bonuses (pending with coupon code) for client
export const getRedeemableBonuses = () =>
  api.get('/wallet/bonus/redeemable');

// Claim bonus by coupon code (creates pending bonus, no transfer)
export const claimBonus = (couponCode) =>
  api.post('/wallet/bonus/claim', { coupon_code: couponCode });

// Redeem bonus by coupon code and bonus id (transfers funds)
export const redeemBonus = (couponCode, bonusId) =>
  api.post('/wallet/bonus/redeem', { coupon_code: couponCode, bonus_id: bonusId });
