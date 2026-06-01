export interface Station {
  id: string;
  name: string;
  url: string;
  urlResolved: string;
  homepage: string;
  favicon: string;
  tags: string[];
  genre?: string;
  country: string;
  language: string[] | string;
  votes: number;
  codec: string;
  bitrate: number;
  hls: boolean;
  lastcheckok: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isError: boolean;
  volume: number;
  currentStation: Station | null;
  bufferStatus: 'GOOD' | 'LOW' | 'RECONNECTING' | 'IDLE';
  playbackTime: number;
  isMuted: boolean;
  play: (station?: Station) => Promise<void>;
  pause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  updatePlaybackTime: () => void;
  setBufferStatus: (status: 'GOOD' | 'LOW' | 'RECONNECTING' | 'IDLE') => void;
}
