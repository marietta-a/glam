import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { STORE_URLS } from '@/constants';

interface VersionInfo {
  version: string;
  build: string;
}


/**
 * Retrieves the current app version information.
 */
export const getAppVersion = async (): Promise<VersionInfo> => {
  if (!Capacitor.isNativePlatform()) {
    return { version: 'Web', build: '0' };
  }
  try {
    const info = await App.getInfo();
    return info || { version: '1.0.0', build: '8' };
  } catch (e) {
    return { version: '1.0.0', build: '8' };
  }
};

/**
 * Checks if a newer version of the app is available in the store.
 * Uses the @capawesome/capacitor-app-update plugin for native integration.
 */
export const checkForAppUpdate = async (): Promise<{ hasUpdate: boolean, storeUrl: string, latestVersion: string } | null> => {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    // Queries the platform-specific store (Play Store/App Store)
    const result = await AppUpdate.getAppUpdateInfo();

    /**
     * updateAvailability enum from plugin:
     * UNKNOWN = 0
     * UPDATE_NOT_AVAILABLE = 1
     * UPDATE_AVAILABLE = 2
     * UPDATE_IN_PROGRESS = 3
     */
    const hasUpdate = result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;

    const platform = Capacitor.getPlatform();
    const fallbackUrl = platform === 'ios' ? STORE_URLS.ios : STORE_URLS.android;

    return {
      hasUpdate,
      storeUrl: fallbackUrl, // On Android, we can actually trigger the native dialog instead of a URL
      latestVersion: result.availableVersionName || 'New Version'
    };

  } catch (error) {
    console.warn("Boutique update check failed:", error);
    return null;
  }
};

/**
 * Opens the app store or starts the update process.
 */
export const openStore = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // On Android, this triggers the native In-App Update flow
      // On iOS, this usually opens the App Store
      await AppUpdate.openAppStore();
    } catch (e) {
      // Fallback to manual URL if native trigger fails
      if (url) window.location.href = url;
    }
  } else if (url) {
    window.location.href = url;
  }
};

/**
 * Specifically for Android: Triggers an immediate in-app update if available.
 */
export const performImmediateUpdate = async () => {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await AppUpdate.performImmediateUpdate();
    } catch (e) {
      console.error("Immediate update failed:", e);
    }
  }
};