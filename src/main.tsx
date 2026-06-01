import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { TextZoom } from '@capacitor/text-zoom';
import { Capacitor } from '@capacitor/core';

registerSW({ immediate: true });

if (Capacitor.isNativePlatform()) {
  TextZoom.set({ value: 1 }).catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
