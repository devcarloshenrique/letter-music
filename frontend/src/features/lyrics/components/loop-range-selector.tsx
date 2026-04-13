import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface LoopRangeSelectorProps {
  duration: number;
  startOffset: number;
  endOffset: number;
  onRangeChange: (start: number, end: number) => void;
  onReset: () => void;
  startTimeLabel: string;
  endTimeLabel: string;
}

export const LoopRangeSelector: React.FC<LoopRangeSelectorProps> = ({
  duration,
  startOffset,
  endOffset,
  onRangeChange,
  onReset,
  startTimeLabel,
  endTimeLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  const getPercentage = (value: number) => (value / duration) * 100;

  const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(type);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newValue = (x / rect.width) * duration;

      if (isDragging === 'start') {
        const nextStart = Math.min(newValue, endOffset - 0.1);
        onRangeChange(nextStart, endOffset);
      } else {
        const nextEnd = Math.max(newValue, startOffset + 0.1);
        onRangeChange(startOffset, nextEnd);
      }
    },
    [isDragging, duration, startOffset, endOffset, onRangeChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generate random heights for waveform
  const bars = Array.from({ length: 40 }).map((_, i) => ({
    height: 20 + Math.random() * 40,
    isActive: getPercentage(startOffset) <= (i / 40) * 100 && (i / 40) * 100 <= getPercentage(endOffset)
  }));

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="mt-6 overflow-hidden"
    >
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-primary text-on-primary text-[10px] font-bold rounded uppercase tracking-tighter shadow-[0_0_15px_rgba(219,144,255,0.4)]">
            Loop Active
          </span>
          <span className="text-[11px] font-mono text-primary font-bold">
            {startTimeLabel} — {endTimeLabel}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hover:text-white transition-colors"
        >
          Reset Markers
        </button>
      </div>

      <div ref={containerRef} className="relative h-20 w-full flex items-center justify-between gap-[2px] cursor-pointer">
        {/* Background Waveform */}
        <div className="absolute inset-0 flex items-center justify-between gap-[1px] opacity-20">
          {bars.map((bar, i) => (
            <div
              key={i}
              className="w-[2px] bg-white rounded-full"
              style={{ height: `${bar.height}%` }}
            />
          ))}
        </div>

        {/* Active Selection Range Waveform */}
        <div 
          className="absolute h-full bg-primary/5 border-x border-primary/30 flex items-center justify-between gap-[1px] overflow-hidden pointer-events-none"
          style={{
            left: `${getPercentage(startOffset)}%`,
            right: `${100 - getPercentage(endOffset)}%`
          }}
        >
           {bars.map((bar, i) => {
             const barPos = (i / 40) * 100;
             const inRange = barPos >= getPercentage(startOffset) && barPos <= getPercentage(endOffset);
             return inRange ? (
               <div
                 key={i}
                 className="w-[2px] bg-primary rounded-full shadow-[0_0_5px_rgba(219,144,255,0.5)]"
                 style={{ height: `${bar.height}%` }}
               />
             ) : null;
           })}
        </div>

        {/* Draggable Handles */}
        <div
          onMouseDown={handleMouseDown('start')}
          className="absolute -translate-x-1/2 h-full flex flex-col items-center cursor-ew-resize group/handle z-10"
          style={{ left: `${getPercentage(startOffset)}%` }}
        >
          <div className="w-[2px] h-full bg-primary shadow-[0_0_10px_#db90ff]" />
          <div className="w-4 h-4 rounded-full bg-white border-4 border-primary absolute top-1/2 -translate-y-1/2 group-hover/handle:scale-125 transition-transform" />
        </div>

        <div
          onMouseDown={handleMouseDown('end')}
          className="absolute translate-x-1/2 h-full flex flex-col items-center cursor-ew-resize group/handle z-10"
          style={{ left: `${getPercentage(endOffset)}%` }}
        >
          <div className="w-[2px] h-full bg-primary shadow-[0_0_10px_#db90ff]" />
          <div className="w-4 h-4 rounded-full bg-white border-4 border-primary absolute top-1/2 -translate-y-1/2 group-hover/handle:scale-125 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};
