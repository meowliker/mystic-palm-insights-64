import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1702666ecc3547af92d2210bcde05e9f',
  appName: 'PalmCosmic - AI Palm Reading',
  webDir: 'dist',
  server: {
    url: 'https://1702666e-cc35-47af-92d2-210bcde05e9f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    }
  }
};

export default config;