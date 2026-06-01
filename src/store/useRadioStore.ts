import { create } from 'zustand';
import { Station } from '../types';
import { db } from '../storage/db';

interface RadioState {
  favorites: Station[];
  currentIndex: number;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (station: Station) => Promise<void>;
  isFavorite: (stationId: string) => boolean;
  nextFavorite: () => Station | null;
  prevFavorite: () => Station | null;
  setCurrentIndex: (id: string) => void;
  exportFavorites: () => Promise<void>;
  importFavorites: (file: File) => Promise<void>;
}

export const useRadioStore = create<RadioState>((set, get) => ({
  favorites: [],
  currentIndex: -1,

  loadFavorites: async () => {
    const favs = await db.favorites.toArray();
    set({ favorites: favs });
  },

  toggleFavorite: async (station) => {
    const exists = await db.favorites.get(station.id);
    if (exists) {
      await db.favorites.delete(station.id);
    } else {
      await db.favorites.put(station);
    }
    await get().loadFavorites();
  },

  isFavorite: (stationId) => {
    return get().favorites.some(f => f.id === stationId);
  },

  setCurrentIndex: (id) => {
    const idx = get().favorites.findIndex(f => f.id === id);
    set({ currentIndex: idx });
  },

  nextFavorite: () => {
    const { favorites, currentIndex } = get();
    if (favorites.length === 0) return null;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= favorites.length) nextIdx = 0;
    set({ currentIndex: nextIdx });
    return favorites[nextIdx];
  },

  prevFavorite: () => {
    const { favorites, currentIndex } = get();
    if (favorites.length === 0) return null;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) prevIdx = favorites.length - 1;
    set({ currentIndex: prevIdx });
    return favorites[prevIdx];
  },

  exportFavorites: async () => {
    const favs = await db.favorites.toArray();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favs));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "retrostream_favorites.json");
    dlAnchorElem.click();
  },

  importFavorites: async (file) => {
    try {
      const text = await file.text();
      const favs: Station[] = JSON.parse(text);
      if (Array.isArray(favs)) {
        for (const fav of favs) {
          if (fav.id && fav.name && fav.url) {
            await db.favorites.put(fav);
          }
        }
        await get().loadFavorites();
      }
    } catch (e) {
      console.error("Failed to import", e);
    }
  }
}));
