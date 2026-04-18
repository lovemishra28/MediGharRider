import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const PRODUCTION_URL = 'https://medigharrider-api.onrender.com';

export const getBaseUrl = async () => `${PRODUCTION_URL}/api`;
export const getSocketUrl = async () => PRODUCTION_URL;

const api = axios.create({
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = await getBaseUrl();
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle auth errors (e.g., token expired)
    return Promise.reject(error);
  }
);

export default api;
