import React, { useEffect, useState } from 'react';
import { Wifi, RadioTower, Heart } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useRadioStore } from '../store/useRadioStore';



export const LCDDisplay: React.FC = () => {
  const { currentStation, bufferStatus, isPlaying, isLoading, isError, volume, playbackTime, isMuted } = usePlayerStore();
  const { isFavorite, toggleFavorite } = useRadioStore();
  const [blink, setBlink] = useState(true);

  const [isMarqueePlaying, setIsMarqueePlaying] = useState(true);

  useEffect(() => {
    let timer: any;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        timer = setInterval(() => setBlink(b => !b), 500);
      }
    };

    if (!document.hidden) {
      timer = setInterval(() => setBlink(b => !b), 500);
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const name = currentStation?.name || 'SEARCH STATION';
  const genre = currentStation?.genre?.split(',')[0] || currentStation?.country || 'WAITING...';
  const isFav = currentStation ? isFavorite(currentStation.id) : false;
  
  // Progress bar chunks
  const totalChunks = 15;
  const filledChunks = isPlaying || isLoading ? (playbackTime % 60) / 60 * totalChunks : 0;

  return (
    <div className="lcd-bezel w-full mx-auto shadow-2xl relative">
      <div className="lcd-display w-full aspect-[16/9] max-h-[190px] p-4 flex flex-col justify-between">
        
        {/* Top Line */}
        <div className="flex justify-between items-start w-full relative">
          <div className="flex items-start mt-[-2px]">
             <RadioTower size={28} strokeWidth={2} className="text-[#111] opacity-90" />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 font-sans font-medium text-[13px] tracking-wide text-[#111]">ОНЛАЙН РАДИО</span>
          <div className="flex flex-col items-end gap-[1px] leading-none text-[#111]">
            <div className="flex items-center gap-1.5 opacity-90">
              <Wifi size={14} strokeWidth={3} className={(isLoading || isPlaying) && !isError ? 'opacity-100' : 'opacity-20'} />
              <span className="font-sans font-bold text-sm tracking-tight pt-0.5">
                {currentStation ? (currentStation.bitrate > 0 ? currentStation.bitrate : '128') : '---'}
              </span>
            </div>
            <span className="font-sans text-[10px] font-bold tracking-tight">Kbps</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center flex-1 w-full gap-1 mt-1">
           <div 
             className="flex items-center justify-center w-full text-[#111] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
             onClick={() => setIsMarqueePlaying(!isMarqueePlaying)}
           >
             <div className={`text-[36px] w-full font-lcd uppercase tracking-[0.04em] leading-none pt-3 pb-1 font-normal [text-shadow:0_0_1px_rgba(0,0,0,0.2)] ${!isMarqueePlaying && name.length > 9 ? 'text-left' : 'text-center'}`}>
               {name.length > 9 ? (
                 isMarqueePlaying ? (
                  <div className="gpu-marquee-container">
                    <div 
                      className="gpu-marquee-wrapper" 
                      style={{ animation: `seamlessMarquee ${Math.max(12, name.length * 0.8)}s linear 3` }}
                      onAnimationEnd={() => setIsMarqueePlaying(false)}
                    >
                      <div className="pr-16">{name}</div>
                      <div className="pr-16">{name}</div>
                    </div>
                  </div>
                 ) : (
                   <div className="w-full truncate text-left">{name}</div>
                 )
               ) : (
                 <div className="w-full flex justify-center text-center">{name}</div>
               )}
             </div>
           </div>
           
           <div className="flex w-full justify-center relative items-center text-[#111] mt-1">
             <span className="font-sans font-medium text-[17px] truncate px-10 opacity-100 tracking-wide">{genre}</span>
             <button onClick={() => { if(currentStation) toggleFavorite(currentStation) }} className="absolute right-0 p-2 -mr-2 cursor-pointer active:scale-90 transition-transform">
                <Heart size={20} className={`opacity-100 ${isFav ? 'fill-[#111] text-[#111]' : 'text-[#111]'}`} />
             </button>
           </div>
        </div>

        {/* Bottom Line & Progress */}
        <div className="flex items-center gap-3 w-full font-sans font-bold text-sm text-[#111] mt-1 opacity-90">
          <span className="min-w-[45px] text-left tabular-nums text-[15px]">
            {isPlaying || isLoading ? formatTime(playbackTime) : '00:35'}
          </span>
          
          <div className="flex-1 flex items-center gap-0.5 h-[12px] relative">
             <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-[#111]"></div>
             <div className="flex gap-[3px] z-10 max-w-[40%] bg-[#ffb700] p-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-[10px] w-[6px] bg-[#111]`}></div>
                ))}
             </div>
          </div>
          
          <span className="min-w-[45px] text-right text-[15px]">
             --:--
          </span>
        </div>
      </div>
    </div>
  );
};

