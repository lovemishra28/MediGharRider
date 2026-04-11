import { getCustomServerIp } from '../services/storage';

// ─── API Configuration ───────────────────────────────────
// Default Fallback IP
const DEFAULT_DEV_HOST = '10.0.2.2';
const DEFAULT_PORT = 5000;

export const getBaseUrl = async () => {
  try {
    const customIp = await getCustomServerIp();
    if (customIp) {
      return `http://${customIp}:${DEFAULT_PORT}/api`;
    }
  } catch (error) {
    // Ignore error
  }
  return `http://${DEFAULT_DEV_HOST}:${DEFAULT_PORT}/api`;
};

export const getSocketUrl = async () => {
  try {
    const customIp = await getCustomServerIp();
    if (customIp) {
      return `http://${customIp}:${DEFAULT_PORT}`;
    }
  } catch (error) {
    // Ignore error
  }
  return `http://${DEFAULT_DEV_HOST}:${DEFAULT_PORT}`;
};

// Static export kept for backward compatibility (will use default initially, but dynamic calls use getBaseUrl)
export const API_BASE_URL = `http://${DEFAULT_DEV_HOST}:${DEFAULT_PORT}/api`;
export const SOCKET_URL = `http://${DEFAULT_DEV_HOST}:${DEFAULT_PORT}`;
