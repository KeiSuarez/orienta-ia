import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ar.gob.sssalud.orientaia',
  appName: 'Orienta IA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#0B192C',
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      releaseType: 'APK',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0B192C',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#0B192C',
      style: 'DARK',
      overlaysWebView: false,
    },
  },
};

export default config;
