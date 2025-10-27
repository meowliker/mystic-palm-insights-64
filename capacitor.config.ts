import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.palmcosmic.app",
  appName: "PalmCosmic - AI Palm Reading",
  webDir: "dist",
  plugins: {
    Camera: {
      permissions: ["camera"],
    },
    CameraPreview: {
      permissions: ["camera"],
    },
  },
};

export default config;
