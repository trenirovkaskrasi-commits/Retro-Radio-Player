import Hls from 'hls.js';
import { Station } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';

class AudioEngine {
  private static instance: AudioEngine;
  private audio: HTMLAudioElement;
  private hls: Hls | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private reconnectTimeout: any = null;
  
  private constructor() {
    this.audio = new Audio();
    // Essential for background playback on mobile:
    this.audio.preload = 'metadata';
    
    this.setupListeners();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private setupListeners() {
    this.audio.addEventListener('playing', () => {
      this.reconnectAttempts = 0;
      usePlayerStore.getState().setBufferStatus('GOOD');
      usePlayerStore.setState({ isPlaying: true, isLoading: false, isError: false });
      this.updateMediaSession(usePlayerStore.getState().currentStation);
    });

    this.audio.addEventListener('waiting', () => {
      usePlayerStore.getState().setBufferStatus('LOW');
      usePlayerStore.setState({ isLoading: true });
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error', e);
      this.handleRecoverableError();
    });

    this.audio.addEventListener('stalled', () => {
      // Don't fully restart on stalled, just show loading state as the browser may recover
      usePlayerStore.getState().setBufferStatus('LOW');
      usePlayerStore.setState({ isLoading: true });
    });

    if (Capacitor.isNativePlatform()) {
      MediaSession.addListener('play', () => usePlayerStore.getState().play());
      MediaSession.addListener('pause', () => usePlayerStore.getState().pause());
      MediaSession.addListener('previoustrack', () => {
        window.dispatchEvent(new CustomEvent('rs-previous-station'));
      });
      MediaSession.addListener('nexttrack', () => {
        window.dispatchEvent(new CustomEvent('rs-next-station'));
      });
    }
  }

  private handleRecoverableError() {
    usePlayerStore.getState().setBufferStatus('RECONNECTING');
    usePlayerStore.setState({ isLoading: true, isError: true });
    
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = window.setTimeout(() => {
        const station = usePlayerStore.getState().currentStation;
        if (station) {
          // Force a full reload of the stream
          this.play(station);
        }
      }, backoff);
    } else {
      usePlayerStore.setState({ isPlaying: false, isLoading: false, isError: true });
    }
  }

  private async updateMediaSession(station: Station | null) {
    if (Capacitor.isNativePlatform() && station) {
      try {
        await MediaSession.setMetadata({
          title: station.name,
          artist: 'RetroStream Radio',
          album: `${station.genre || 'Radio'} - ${station.country || 'Global'}`,
          artwork: [
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        await MediaSession.setPlaybackState({ playbackState: usePlayerStore.getState().isPlaying ? 'playing' : 'paused' });
      } catch (e) {
        console.error('MediaSession setMetadata error', e);
      }
    } else if ('mediaSession' in navigator && station) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: 'RetroStream Radio',
        album: `${station.genre || 'Radio'} - ${station.country || 'Global'}`,
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      // Actions
      navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().play());
      navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        window.dispatchEvent(new CustomEvent('rs-previous-station'));
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        window.dispatchEvent(new CustomEvent('rs-next-station'));
      });
    }
  }

  public setVolume(vol: number) {
    if (typeof vol !== 'number' || isNaN(vol)) return;
    const norm = Math.max(0, Math.min(1, vol / 100));
    this.audio.volume = norm;
  }

  public async play(station?: Station) {
    clearTimeout(this.reconnectTimeout);
    
    let targetStation = station;
    
    // If no explicit station passed, but we have a current one and are in an error state,
    // force a reload using the current station.
    if (!targetStation && usePlayerStore.getState().isError) {
      targetStation = usePlayerStore.getState().currentStation || undefined;
    }
    
    if (targetStation) {
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
      
      usePlayerStore.setState({ currentStation: targetStation, isLoading: true, isError: false });
      usePlayerStore.getState().setBufferStatus('RECONNECTING');

      const url = targetStation.urlResolved || targetStation.url;
      const isHlsUrl = url.includes('.m3u8') || targetStation.hls;

      if (isHlsUrl && Hls.isSupported()) {
        this.hls = new Hls({
          maxBufferLength: 300, // 5 min buffer roughly
          maxMaxBufferLength: 600,
          liveSyncDurationCount: 7, // generous for stability
        });
        this.hls.loadSource(url);
        this.hls.attachMedia(this.audio);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.audio.play().catch(console.error);
        });
        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            this.handleRecoverableError();
          }
        });
      } else {
        this.audio.src = url;
        this.audio.load();
        try {
          await this.audio.play();
        } catch (err) {
          console.error('Play attempt failed', err);
          this.handleRecoverableError();
        }
      }
    } else {
      // Just resume whatever is loaded if there's no error
      if (this.audio.src || this.hls) {
        this.audio.play().catch(console.error);
      }
    }
  }

  public pause() {
    this.audio.pause();
    usePlayerStore.setState({ isPlaying: false, isLoading: false });
    usePlayerStore.getState().setBufferStatus('IDLE');
    if (Capacitor.isNativePlatform()) {
       MediaSession.setPlaybackState({ playbackState: 'paused' }).catch(() => {});
    }
  }

  public stop() {
    this.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}

export const engine = AudioEngine.getInstance();
