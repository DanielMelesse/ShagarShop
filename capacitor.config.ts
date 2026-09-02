import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "com.shegershop.app",
  appName: "ShegerShop",
  webDir: "out",
  server: {
    url: serverUrl.replace(/\/$/, ""),
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
