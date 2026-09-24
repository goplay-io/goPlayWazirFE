import { getApiClient } from '../axios';

const api = getApiClient('user');

export const getCampaigns = () =>
  api.get('/campaigns');

export const getAffiliateFunds = () =>
  api.get('/campaigns/funds');

export const createCampaign = (data) =>
  api.post('/campaigns', data);

export const withdrawCommission = () =>
  api.post('/campaigns/funds/withdraw');

export const getWithdrawalHistory = (date) =>
  api.get('/campaigns/withdrawal-history', { params: { date } });
