'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeftRight } from 'lucide-react';

export default function BeforeAfter() {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <section id="smile-transform" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
          >
            <Sparkles className="text-[#D4AF37]" size={14} />
            <span className="text-xs text-gray-200 font-semibold uppercase tracking-widest">Interactive Comparison</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            Smile Transformations
          </motion.h2>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto rounded-full" />
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Drag the slider to witness the dramatic before and after results of our cosmetic implants and veneers.
          </p>
        </div>

        {/* Draggable Slider Container */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden cursor-ew-resize border border-white/10 select-none shadow-2xl glass-panel p-2"
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {/* Before Image (Base) */}
            <img 
              src="/images/smile_before.png" 
              alt="Crooked Teeth Before"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none smooth-image"
            />
            <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300">
              Before Treatment
            </div>

            {/* After Image (Overlay clipped by sliderPos) */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img 
                src="/images/smile_after.png" 
                alt="Perfect Teeth After"
                className="w-full h-full object-cover pointer-events-none smooth-image"
              />
            </div>
            <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-lg bg-[#145DA0]/80 backdrop-blur-sm border border-white/10 text-xs font-bold uppercase tracking-wider text-white">
              After Makeover
            </div>

            {/* Slider bar & handle */}
            <div 
              className="absolute inset-y-0 z-30 w-[3px] bg-white cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-10 h-10 rounded-full bg-white text-black shadow-2xl border-2 border-[#D4AF37] flex items-center justify-center transform -translate-x-1/2 pointer-events-none hover:scale-110 transition-transform">
                <ArrowLeftRight size={16} className="text-[#0B1220]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
