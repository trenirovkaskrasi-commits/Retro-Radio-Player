import { create } from 'zustand';
import { PlayerState } from '../types';
import { engine } from '../audio/AudioEngine';

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  isLoading: false,
  isError: false,
  volume: 75,
  currentStation: null,
  bufferStatus: 'IDLE',
  playbackTime: 0,
  isMuted: false,

  play: async (station) => {
    await engine.play(station);
  },
  
  pause: () => {
    engine.pause();
  },
  
  setVolume: (vol) => {
    const finalVol = get().isMuted ? 0 : vol;
    engine.setVolume(finalVol);
    set({ volume: vol });
  },

  toggleMute: () => {
    const isMuted = !get().isMuted;
    engine.setVolume(isMuted ? 0 : get().volume);
    set({ isMuted });
  },

  setBufferStatus: (status) => set({ bufferStatus: status }),
  
  updatePlaybackTime: () => set((state) => ({ playbackTime: state.playbackTime + 1 })),
}));
