import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface KnobProps {
  value: number;
  onChange: (val: number) => void;
  onDoubleClick?: () => void;
  min: number;
  max: number;
  label?: string;
}

export const Knob: React.FC<KnobProps> = ({ value, onChange, onDoubleClick, min, max, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  
  const calculateRotation = (val: number) => {
    // scale from min-max to -135deg to 135deg
    const percentage = (val - min) / (max - min);
    return -135 + (percentage * 270);
  };

  const valueRef = useRef(value);
  
  useEffect(() => {
    if (!isRotating) {
      valueRef.current = value;
    }
  }, [value, isRotating]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    setIsRotating(true);
    
    const startY = e.clientY;
    const startX = e.clientX;
    const startValue = valueRef.current;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Primary control via vertical drag, but horizontal works too
      const deltaY = startY - moveEvent.clientY; 
      const deltaX = moveEvent.clientX - startX;
      
      const delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
      
      // Adjust sensitivity
      const sensitivity = 0.8;
      const valChange = delta * sensitivity;
      
      let newVal = startValue + valChange;
      
      if (isNaN(newVal)) return;
      if (newVal < min) newVal = min;
      if (newVal > max) newVal = max;

      valueRef.current = newVal;
      onChange(newVal);
    };

    const handlePointerUp = () => {
      setIsRotating(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Generate tick marks (31 ticks for example)
    const ticks = Array.from({ length: 31 }).map((_, i) => {
    const angle = -135 + (i * (270 / 30));
    // Check if the current value has passed this tick
    const currentAngle = calculateRotation(value);
    const isActive = angle <= currentAngle;
    
    return (
      <div 
        key={i} 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
      >
        <div 
          className={`w-[2.5px] h-[3.5px] rounded-full mt-[-84px] ${isActive ? 'bg-[#ffb700] shadow-[0_0_4px_#ffb700]' : 'bg-zinc-500'}`} 
        />
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center select-none w-full relative touch-none" ref={containerRef}>
      <span className="absolute -top-11 text-[12px] font-bold tracking-widest text-zinc-200 uppercase z-10">{label}</span>
      
      <div className="relative w-[150px] h-[150px] flex items-center justify-center">
        {/* Tick marks ring */}
        <div className="absolute inset-0 pointer-events-none">
          {ticks}
        </div>
        
        <div className="absolute bottom-1 -left-1 text-[10px] text-zinc-300 font-medium uppercase tracking-wider">MIN</div>
        <div className="absolute bottom-1 -right-1 text-[10px] text-zinc-300 font-medium uppercase tracking-wider">MAX</div>

        <motion.div
          onPointerDown={handlePointerDown}
          onDoubleClick={onDoubleClick}
          className="rotary-knob w-[116px] h-[116px] rounded-full relative cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
          animate={{ rotate: calculateRotation(value) }}
          transition={{ type: "tween", ease: "linear", duration: isRotating ? 0 : 0.2 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Circular brushing texture */}
          <div className="absolute inset-0 knob-texture"></div>
          
          {/* Yellow Indicator Line */}
          <div className="absolute top-2 w-[4px] h-5 bg-[#ffb700] rounded-sm shadow-[0_0_8px_#ffb700] z-10 box-border border-b border-[#cca000]" />
        </motion.div>
      </div>
    </div>
  );
};
