import { getCustomServerIp } from '../services/storage';

// ─── API Configuration ───────────────────────────────────
// ⚠️ PASTE YOUR RENDER URL SECURELY HERE (Do not add a slash '/' at the end)
const PRODUCTION_URL = 'https://medigharrider-api.onrender.com';

export const getBaseUrl = async () => {
  // In release APK, always use deployed server to avoid stale local IP issues.
  if (!__DEV__) {
    return `${PRODUCTION_URL}/api`;
  }

  try {
    let customIp = await getCustomServerIp();
    if (customIp) {
      customIp = customIp.replace('http://', '').replace('https://', '').split(':')[0];
      return `http://${customIp}:5000/api`;
    }
  } catch (error) {
    // Ignore error
  }

  return `${PRODUCTION_URL}/api`;
};

export const getSocketUrl = async () => {
  // In release APK, always use deployed server to avoid stale local IP issues.
  if (!__DEV__) {
    return PRODUCTION_URL;
  }

  try {
    let customIp = await getCustomServerIp();
    if (customIp) {
      customIp = customIp.replace('http://', '').replace('https://', '').split(':')[0];
      return `http://${customIp}:5000`;
    }
  } catch (error) {
    // Ignore error
  }

  return PRODUCTION_URL;
};
