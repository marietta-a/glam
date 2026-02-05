import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glamai',
  appName: 'GlamAI',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // We control the duration in code
      launchAutoHide: false, // Critical: Don't hide automatically
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true, // Hide native spinner, use our HTML one or just the image
    },
  }
};

export default config;
