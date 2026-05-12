import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_APPS_KEY = 'doomlock_blocked_apps';

export interface BlockedApp {
  packageName: string;
  displayName: string;
}

export const DEFAULT_BLOCKED_APPS: BlockedApp[] = [
  { packageName: 'com.instagram.android', displayName: 'Instagram' },
  { packageName: 'com.zhiliaoapp.musically', displayName: 'TikTok' },
  { packageName: 'com.google.android.youtube', displayName: 'YouTube' },
  { packageName: 'com.twitter.android', displayName: 'Twitter/X' },
  { packageName: 'com.snapchat.android', displayName: 'Snapchat' },
  { packageName: 'com.facebook.katana', displayName: 'Facebook' },
  { packageName: 'com.reddit.frontpage', displayName: 'Reddit' },
];

export const getBlockedApps = async (): Promise<BlockedApp[]> => {
  const stored = await AsyncStorage.getItem(BLOCKED_APPS_KEY);
  if (!stored) {
    await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(DEFAULT_BLOCKED_APPS));
    return DEFAULT_BLOCKED_APPS;
  }
  return JSON.parse(stored) as BlockedApp[];
};

export const saveBlockedApps = async (apps: BlockedApp[]): Promise<void> => {
  await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(apps));
};
