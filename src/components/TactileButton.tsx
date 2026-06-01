import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TactileButtonProps extends HTMLMotionProps<"button"> {
  label?: string;
  isActive?: boolean;
  shape?: 'circular' | 'rectangular';
  icon?: React.ReactNode;
}

export const TactileButton: React.FC<TactileButtonProps> = ({ 
  label, 
  isActive, 
  shape = 'rectangular', 
  icon,
  className, 
  ...props 
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        className={cn(
          "physical-button relative flex items-center justify-center flex-shrink-0",
          shape === 'circular' ? "w-[68px] h-[68px] rounded-full" : "w-full h-16 rounded-[12px]",
          className
        )}
        whileTap={{ scale: 0.96 }}
        {...props}
      >
        <div className={cn(
          "text-[#ffb700] flex items-center justify-center pointer-events-none drop-shadow-[0_0_8px_rgba(255,183,0,0.3)] opacity-90",
          shape === 'circular' ? "w-[26px] h-[26px]" : "w-[34px] h-[34px]"
        )}>
          {icon}
        </div>
      </motion.button>
      {label && (
        <span className="text-[11px] font-sans font-medium tracking-wide text-zinc-100 uppercase mt-0.5">
          {label}
        </span>
      )}
    </div>
  );
};

