import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.palmcosmic.app',
  appName: 'PalmCosmic - AI Palm Reading',
  webDir: 'dist',
  server: {
    url: 'https://18040da5-f7a6-4b0c-a9df-64513a4b1d67.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    CameraPreview: {
      permissions: ['camera']
    }
  }
};

export default config;