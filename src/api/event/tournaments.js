import { getApiClient } from '../axios';

const api = getApiClient('event');

export const getAvailableTournaments = (eventTypeId) => 
  api.get(`/events/betfair/tournaments/available/${eventTypeId}`);

