import { NativeModules } from 'react-native';
import { getBlockedApps } from './blockedApps';

const { BlockingModule } = NativeModules;

export const isAccessibilityServiceEnabled = (): Promise<boolean> => {
  return BlockingModule.isAccessibilityServiceEnabled();
};

export const openAccessibilitySettings = (): void => {
  BlockingModule.openAccessibilitySettings();
};

export const syncBlockedPackages = async (): Promise<void> => {
  const apps = await getBlockedApps();
  const packageNames = apps.map(a => a.packageName);
  BlockingModule.updateBlockedPackages(packageNames);
};
