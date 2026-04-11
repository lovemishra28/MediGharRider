import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@medighar_access_token',
  REFRESH_TOKEN: '@medighar_refresh_token',
  RIDER: '@medighar_rider',
};

// ─── Token Management ────────────────────────────────────

export const getAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
};

export const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
  await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
};

export const clearTokens = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.ACCESS_TOKEN);
  await AsyncStorage.removeItem(KEYS.REFRESH_TOKEN);
  await AsyncStorage.removeItem(KEYS.RIDER);
};

// ─── Rider Data ──────────────────────────────────────────

export const getRider = async (): Promise<any | null> => {
  const data = await AsyncStorage.getItem(KEYS.RIDER);
  return data ? JSON.parse(data) : null;
};

export const setRider = async (rider: any): Promise<void> => {
  await AsyncStorage.setItem(KEYS.RIDER, JSON.stringify(rider));
};
