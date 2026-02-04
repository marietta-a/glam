
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface VersionInfo {
  version: string;
  build: string;
}

interface RemoteVersionInfo {
  latestVersion: string;
  minVersion: string;
  updateUrl?: {
    ios: string;
    android: string;
  };
}

// Configuration
// In a real production app, this URL should point to a JSON file hosted on your web server
// Example JSON content: { "latestVersion": "1.2.0", "minVersion": "1.0.0", "updateUrl": { "android": "market://...", "ios": "itms-apps://..." } }
const REMOTE_VERSION_URL = 'https://glamai-app-assets.vercel.app/version.json';

// Placeholder store URLs - Replace these with your actual App Store / Play Store IDs
const STORE_URLS = {
  android: 'market://details?id=com.glamai.app',
  ios: 'itms-apps://itunes.apple.com/app/id123456789'
};

/**
 * Compares two semantic version strings (e.g., "1.0.0" vs "1.0.1")
 * Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 === v2
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

export const getAppVersion = async (): Promise<VersionInfo> => {
  if (!Capacitor.isNativePlatform()) {
    return { version: 'Web', build: '0' };
  }
  return await App.getInfo();
};

export const checkForAppUpdate = async (): Promise<{ hasUpdate: boolean, storeUrl: string, latestVersion: string } | null> => {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    // 1. Get current installed version
    const appInfo = await App.getInfo();
    const currentVersion = appInfo.version;

    // 2. Fetch remote version info
    // Note: We use a timeout to prevent hanging if the user is offline or server is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // MOCKING THE FETCH FOR DEMONSTRATION 
    // In a real scenario, you would uncomment the fetch line below:
    // const response = await fetch(REMOTE_VERSION_URL, { signal: controller.signal });
    // const remoteData: RemoteVersionInfo = await response.json();
    
    // MOCK DATA: Simulating a scenario where a newer version exists
    // Change 'latestVersion' to test the UI
    const remoteData: RemoteVersionInfo = {
       latestVersion: currentVersion, // Set to higher than current to test (e.g., "9.9.9")
       minVersion: "1.0.0",
       updateUrl: STORE_URLS
    };

    clearTimeout(timeoutId);

    // 3. Compare
    if (compareVersions(remoteData.latestVersion, currentVersion) > 0) {
      const platform = Capacitor.getPlatform();
      const url = platform === 'ios' 
        ? (remoteData.updateUrl?.ios || STORE_URLS.ios)
        : (remoteData.updateUrl?.android || STORE_URLS.android);
        
      return {
        hasUpdate: true,
        storeUrl: url,
        latestVersion: remoteData.latestVersion
      };
    }

    return { hasUpdate: false, storeUrl: '', latestVersion: currentVersion };

  } catch (error) {
    console.warn("Update check failed:", error);
    return null;
  }
};

export const openStore = (url: string) => {
  window.location.href = url;
};
