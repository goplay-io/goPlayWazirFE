import { getApiClient } from '../axios'

const api = getApiClient('user')

export const getPublicInfo = () => api.get('/public/info')
