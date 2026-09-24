import { getApiClient } from "../axios";

const api = getApiClient("user");

// Get banners
export const getBanners = (queryParams = {}) =>
  api.get("/banners/client", { params: queryParams });
