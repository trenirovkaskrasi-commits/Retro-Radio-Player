import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioBrowserApi } from 'radio-browser-api';
import { Station } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';

export const SearchPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const { play } = usePlayerStore();

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const api = new RadioBrowserApi("RetroStream PWA");
      
      const [byName, byCountry, byTag] = await Promise.all([
        api.searchStations({ name: query, limit: 100, hideBroken: true }),
        api.searchStations({ country: query, limit: 100, hideBroken: true }),
        api.searchStations({ tag: query, limit: 100, hideBroken: true })
      ]);
      
      const allStations = [...byName, ...byCountry, ...byTag];
      
      // Deduplicate by id
      const uniqueStations = Array.from(new Map(allStations.map(item => [item.changeId, item])).values());
      
      // Convert mapping
      const mapped: Station[] = uniqueStations.map(s => ({
        id: s.changeId,
        name: s.name,
        url: s.url,
        urlResolved: s.urlResolved,
        homepage: s.homepage,
        favicon: s.favicon,
        tags: s.tags,
        genre: s.tags?.[0] || '',
        country: s.country,
        language: s.language,
        votes: s.votes,
        codec: s.codec,
        bitrate: s.bitrate,
        hls: !!s.hls,
        lastcheckok: !!s.lastCheckOk
      })).filter(s => s.lastcheckok && (s.bitrate >= 64 || s.bitrate === 0 || s.hls));

      setResults(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="absolute inset-0 z-50 bg-hardware-dark flex flex-col pt-12 pb-4 px-4 overflow-hidden shadow-2xl"
        >
          <div className="flex justify-center items-center mb-6 border-b border-zinc-800 pb-2 pt-2">
            <h2 className="text-zinc-200 font-bold uppercase tracking-widest text-sm">ТЪРСЕНЕ НА СТАНЦИИ</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="ЖАНР ИЛИ ИМЕ..."
              className="flex-1 bg-zinc-900 border border-amber-500/50 text-zinc-300 px-3 py-2 rounded focus:outline-none focus:border-amber-500 uppercase text-sm placeholder:text-zinc-600"
            />
            <button 
              onClick={handleSearch}
              className="bg-amber-500 border border-amber-600 text-black px-4 py-2 rounded font-bold hover:bg-amber-400"
            >
              ТЪРСИ
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-16">
            {loading && <div className="text-center text-zinc-600 mt-8 uppercase text-sm">Търсене...</div>}
            
            {!loading && results.map(st => (
              <div 
                key={st.id} 
                onClick={() => { play(st); onClose(); }}
                className="bg-zinc-900/50 border border-zinc-800 p-3 rounded flex justify-between items-center cursor-pointer hover:bg-zinc-800/80 active:bg-zinc-700 transition"
              >
                <div className="overflow-hidden pr-4">
                  <div className="text-zinc-300 font-bold truncate">{st.name}</div>
                  <div className="text-zinc-600 text-xs truncate">
                    {st.genre?.split(',')[0] || st.tags?.[0]} | {st.country}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-zinc-500 text-xs font-mono">{st.codec}</div>
                  <div className="text-zinc-600 text-xs font-mono">{st.bitrate}k</div>
                </div>
              </div>
            ))}
            
            {!loading && results.length === 0 && query && (
              <div className="text-center text-zinc-700 mt-8 uppercase text-sm">НЯМА НАМЕРЕНИ РЕЗУЛТАТИ.</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
