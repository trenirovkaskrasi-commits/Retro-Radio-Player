import { create } from 'zustand';
import { PlayerState } from '../types';
import { engine } from '../audio/AudioEngine';

const savedStationStr = localStorage.getItem('rs_last_station');
const initialStation = savedStationStr ? JSON.parse(savedStationStr) : null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  isLoading: false,
  isError: false,
  volume: 75,
  currentStation: initialStation,
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

usePlayerStore.subscribe((state, prevState) => {
  if (state.currentStation && state.currentStation.id !== prevState.currentStation?.id) {
    localStorage.setItem('rs_last_station', JSON.stringify(state.currentStation));
  }
});
