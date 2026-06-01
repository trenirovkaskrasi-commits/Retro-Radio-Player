import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useRadioStore } from '../store/useRadioStore';
import { Trash2 } from 'lucide-react';

export const FavoritesPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { play } = usePlayerStore();
  const { favorites, toggleFavorite } = useRadioStore();

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
            <h2 className="text-zinc-200 font-bold uppercase tracking-widest text-sm">ЛЮБИМИ СТАНЦИИ</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-16">
            {favorites.length === 0 && (
              <div className="text-center text-zinc-600 mt-8 uppercase text-sm">СПИСЪКЪТ Е ПРАЗЕН.</div>
            )}
            
            {favorites.map(st => (
              <div 
                key={st.id} 
                className="bg-zinc-900/50 border border-zinc-800 p-3 rounded flex justify-between items-center cursor-pointer hover:bg-zinc-800/80 active:bg-zinc-700 transition"
                onClick={() => { play(st); onClose(); }}
              >
                <div className="overflow-hidden pr-4 flex-1">
                  <div className="text-zinc-300 font-bold truncate">{st.name}</div>
                  <div className="text-zinc-600 text-xs truncate">
                    {st.genre?.split(',')[0]} | {st.country}
                  </div>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(st); }}
                    className="p-2 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
