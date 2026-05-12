import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { UnlockModule } = NativeModules;
const UNLOCK_EXPIRY_KEY = 'doomlock_unlock_expiry';

export const setUnlockExpiry = async (durationMs: number): Promise<void> => {
  const expiry = Date.now() + durationMs;
  await AsyncStorage.setItem(UNLOCK_EXPIRY_KEY, String(expiry));
  // Sync to SharedPreferences so the native blocking service can read it
  UnlockModule.setUnlockExpiry(expiry);
};

export const getUnlockExpiry = async (): Promise<number | null> => {
  const value = await AsyncStorage.getItem(UNLOCK_EXPIRY_KEY);
  return value ? parseInt(value, 10) : null;
};

export const clearUnlockExpiry = async (): Promise<void> => {
  await AsyncStorage.removeItem(UNLOCK_EXPIRY_KEY);
  UnlockModule.clearUnlockExpiry();
};

export const getRemainingMs = async (): Promise<number> => {
  const expiry = await getUnlockExpiry();
  if (!expiry) return 0;
  return Math.max(0, expiry - Date.now());
};
