import React, { useEffect, useState, useRef } from 'react';
import { Menu, Heart, Rewind, Play, Pause, FastForward, Download, Upload } from 'lucide-react';
import { LCDDisplay } from './components/LCDDisplay';
import { Knob } from './components/Knob';
import { TactileButton } from './components/TactileButton';
import { SearchPanel } from './components/SearchPanel';
import { FavoritesPanel } from './components/FavoritesPanel';
import { usePlayerStore } from './store/usePlayerStore';
import { useRadioStore } from './store/useRadioStore';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { volume, setVolume, play, pause, isPlaying, currentStation, updatePlaybackTime, toggleMute, isMuted } = usePlayerStore();
  const { loadFavorites, toggleFavorite, isFavorite, nextFavorite, prevFavorite, exportFavorites, importFavorites } = useRadioStore();

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const modalOpenRef = useRef({ search: false, fav: false });
  useEffect(() => {
    modalOpenRef.current = { search: searchOpen, fav: favOpen };
  }, [searchOpen, favOpen]);

  useEffect(() => {
    let listener: any;
    const setupBackBtn = async () => {
      if (Capacitor.isNativePlatform()) {
        listener = await CapApp.addListener('backButton', () => {
          if (modalOpenRef.current.search) {
            setSearchOpen(false);
          } else if (modalOpenRef.current.fav) {
            setFavOpen(false);
          } else {
            CapApp.minimizeApp();
          }
        });
      }
    };
    setupBackBtn();
    return () => {
      if (listener) listener.remove();
    };
  }, []);

  // Handle external media session events
  useEffect(() => {
    const handleNext = () => {
      const next = nextFavorite();
      if (next) play(next);
    };
    const handlePrev = () => {
      const prev = prevFavorite();
      if (prev) play(prev);
    };

    window.addEventListener('rs-next-station', handleNext);
    window.addEventListener('rs-previous-station', handlePrev);
    return () => {
      window.removeEventListener('rs-next-station', handleNext);
      window.removeEventListener('rs-previous-station', handlePrev);
    };
  }, [nextFavorite, prevFavorite, play]);

  // Handle playback timer
  useEffect(() => {
    let interval: any;
    
    const startTimer = () => {
      if (isPlaying && !document.hidden) {
        interval = setInterval(updatePlaybackTime, 1000);
      }
    };
    
    const stopTimer = () => {
      clearInterval(interval);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying, updatePlaybackTime]);

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else play(); // Plays current if exists
  };

  const handleNext = () => {
    const next = nextFavorite();
    if (next) play(next);
  };

  const handlePrev = () => {
    const prev = prevFavorite();
    if (prev) play(prev);
  };

  const handleToggleFavorite = () => {
    if (currentStation) {
      toggleFavorite(currentStation);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importFavorites(file);
      e.target.value = ''; // reset
    }
  };

  return (
    <div className="hardware-body w-full min-h-screen flex flex-col items-center overflow-x-hidden overflow-y-auto pb-8 pt-[env(safe-area-inset-top,40px)]">
      
      {/* Top Speaker Grill */}
      <div className="w-full max-w-[360px] mx-auto px-4 mt-2 flex-shrink-0">
        <div className="speaker-grill grid gap-1.5 p-3.5 bg-[#141414] rounded-2xl shadow-[inset_0_4px_10px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.04)] border border-black" style={{ gridTemplateColumns: 'repeat(23, 1fr)' }}>
          {Array.from({ length: 4 * 23 }).map((_, i) => (
            <div key={i} className="speaker-hole" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-[370px] mx-auto px-4 mb-2 mt-2 flex-shrink-0">
        <LCDDisplay />
      </div>

      {/* Main Controls Rack */}
      <div className="flex flex-col w-full max-w-[370px] mx-auto px-5 mt-1 flex-1 justify-between">
        
        {/* Middle Row: Menu - Knob - Heart */}
        <div className="flex justify-between items-center w-full pt-4">
          <div className="pb-6">
             <TactileButton 
               shape="circular" 
               label="СТАНЦИИ" 
               icon={<Menu size={28} strokeWidth={2.5} />}
               onClick={() => setSearchOpen(true)} 
             />
          </div>
          
          <div className="flex-1 flex justify-center mt-2 z-10">
            <Knob 
              min={0} 
              max={100} 
              value={volume} 
              onChange={setVolume}
              onDoubleClick={toggleMute}
              label="VOLUME"
            />
          </div>

          <div className="pb-6">
            <TactileButton 
              shape="circular"
              label="ЛЮБИМИ" 
              icon={<Heart size={26} strokeWidth={2.5} />}
              onClick={() => setFavOpen(true)}
            />
          </div>
        </div>

        {/* Playback Row */}
        <div className="flex justify-between gap-3 mt-2">
          <TactileButton 
            shape="rectangular"
            label="ПРЕДИШНА" 
            className="flex-1"
            icon={<Rewind size={32} fill="currentColor" />}
            onClick={handlePrev} 
          />
          
          <TactileButton 
            shape="rectangular"
            label="ПУСКАНЕ / ПАУЗА" 
            className="flex-[1.2]"
            icon={
              <div className="flex items-center gap-2 ml-1">
                <Play size={34} fill="currentColor" />
                <Pause size={28} fill="currentColor" />
              </div>
            }
            isActive={isPlaying}
            onClick={handlePlayPause}
          />

          <TactileButton 
            shape="rectangular"
            label="СЛЕДВАЩА" 
            className="flex-1"
            icon={<FastForward size={32} fill="currentColor" />}
            onClick={handleNext} 
          />
        </div>

        {/* Bottom Row */}
        <div className="flex justify-between items-center mt-3 pb-2">
          <TactileButton 
            shape="circular"
            label="ЕКСПОРТ" 
            icon={<Download size={26} />}
            onClick={() => exportFavorites()}
          />
          
          {/* Horizontal vent ridges */}
          <div className="flex-1 flex flex-col gap-3 px-8 mb-4">
            <div className="h-1.5 rounded-full vent-ridge w-full"></div>
            <div className="h-1.5 rounded-full vent-ridge w-full"></div>
            <div className="h-1.5 rounded-full vent-ridge w-full"></div>
            <div className="h-1.5 rounded-full vent-ridge w-full"></div>
          </div>

          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={onFileChange} />
          
          <TactileButton 
            shape="circular"
            label="ИМПОРТ" 
            icon={<Upload size={26} />}
            onClick={() => fileInputRef.current?.click()} 
          />
        </div>
      </div>

      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <FavoritesPanel isOpen={favOpen} onClose={() => setFavOpen(false)} />
    </div>
  );
}


