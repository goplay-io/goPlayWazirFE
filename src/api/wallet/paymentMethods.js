import { getApiClient } from '../axios';

const api = getApiClient('wallet');

/**
 * Get parent user's payment methods by type. Returns { parent, list, eligibility_session_id }.
 * @param {'bank'|'upi'|'crypto'} type
 * @param {number|string} amount
 */
export const getParentPaymentMethods = (type, amount, options = {}) =>
  api.get('/wallet/parent-payment-methods', { params: { type, amount, ...options } });

export const getParentPaymentOptions = (type) =>
  api.get('/wallet/parent-payment-options', { params: { type } });

export const getParentCryptoOptions = (type) =>
  api.get('/wallet/parent-crypto-options', { params: { type } });

export const getCurrencyPreview = (payment_type, amount, options = {}) =>
  api.get('/wallet/currency-preview', { params: { payment_type, amount, ...options } });

/**
 * Get parent's available crypto type names. Returns { types: string[] }.
 */
export const getParentCryptoTypes = () => api.get('/wallet/parent-crypto-types');

export const getCryptoCurrencies = () => api.get('/wallet/crypto-currencies');

export const getBankAccounts = () => api.get('/wallet/bank-accounts');
export const getBankAccountById = (id) => api.get(`/wallet/bank-accounts/${id}`);
export const createBankAccount = (data) => api.post('/wallet/bank-accounts', data);
export const updateBankAccount = (id, data) => api.patch(`/wallet/bank-accounts/${id}`, data);
export const deleteBankAccount = (id) => api.delete(`/wallet/bank-accounts/${id}`);

export const getUpiAccounts = () => api.get('/wallet/upi-accounts');
export const getUpiAccountById = (id) => api.get(`/wallet/upi-accounts/${id}`);
export const createUpiAccount = (data) => api.post('/wallet/upi-accounts', data);
export const updateUpiAccount = (id, data) => api.patch(`/wallet/upi-accounts/${id}`, data);
export const deleteUpiAccount = (id) => api.delete(`/wallet/upi-accounts/${id}`);

export const getCryptoAccounts = () => api.get('/wallet/crypto-accounts');
export const getCryptoAccountById = (id) => api.get(`/wallet/crypto-accounts/${id}`);
export const createCryptoAccount = (data) => api.post('/wallet/crypto-accounts', data);
export const updateCryptoAccount = (id, data) => api.patch(`/wallet/crypto-accounts/${id}`, data);
export const deleteCryptoAccount = (id) => api.delete(`/wallet/crypto-accounts/${id}`);
