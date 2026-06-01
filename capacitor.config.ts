import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.retrostream.radio',
  appName: 'RetroStream Radio',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
