'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { X, TrendingUp } from 'lucide-react';

interface RevenueTrendChartProps {
  data: { label: string; value: number }[];
}

// Particle Background Component for Ambient Effect
const ParticleBackground = () => {
  const particles = Array.from({ length: 15 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        const size = Math.random() * 3 + 2; // 2px to 5px
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const duration = Math.random() * 10 + 15; // 15s to 25s
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500/10"
            style={{
              width: size,
              height: size,
              left: `${initialX}%`,
              top: `${initialY}%`
            }}
            animate={{
              x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
              y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
              opacity: [0.05, 0.25, 0.1, 0.05]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );
      })}
    </div>
  );
};

// Animated Empty State Component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative w-20 h-20 flex items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-blue-500/20"
      />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/5 to-blue-500/20 border border-blue-500/15 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
      >
        <TrendingUp size={20} className="opacity-40" />
      </motion.div>
    </motion.div>
    <div className="text-center space-y-1">
      <h4 className="text-sm font-bold text-white">No Revenue Data</h4>
      <p className="text-xs text-gray-500 max-w-[220px]">No recorded payments found for this period.</p>
    </div>
  </div>
);

// Custom Bar Shape using foreignObject for Custom HTML/CSS/Framer Motion
const CustomBar = React.memo((props: any) => {
  const { x, y, width, height, index, hoveredIndex, setHoveredIndex, onClickBar, data, hasAnimated } = props;
  
  if (height === 0 || isNaN(height)) return null;

  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
  const payload = data[index];
  
  // Growth calculation relative to the previous month
  const getGrowth = (idx: number) => {
    if (idx === 0) return 4.8; // baseline growth placeholder for starting month
    const prev = data[idx - 1]?.value || 1;
    const curr = data[idx]?.value || 0;
    return ((curr - prev) / prev) * 100;
  };
  const growth = getGrowth(index);

  return (
    <foreignObject
      x={x - 10}
      y={y - 45} // extra padding for top values and floating tooltips
      width={width + 20}
      height={height + 55}
      className="overflow-visible"
    >
      <div
        className="w-full h-full flex flex-col justify-end items-center pointer-events-auto relative"
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => onClickBar(index)}
      >
        {/* Floating Tooltip Component */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-44 bg-[#080F21]/95 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-2xl z-[100] text-left pointer-events-none"
              style={{
                boxShadow: "0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(59,130,246,0.15)"
              }}
            >
              {/* Top illuminated line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent" />
              
              <div className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                {payload.label}
              </div>
              <div className="text-sm font-black text-white mt-1">
                ₹{payload.value.toLocaleString('en-IN')}
              </div>
              <div className={`text-[9px] font-extrabold mt-1.5 flex items-center space-x-1 ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <span>{growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`}</span>
                <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">Growth</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated value labels on top of bars (CountUp only runs on initial load) */}
        <div 
          className="text-white font-extrabold text-[10px] tracking-wide mb-1.5 select-none transition-opacity duration-300"
          style={{ opacity: isDimmed ? 0.3 : 1 }}
        >
          ₹{hasAnimated ? `${Math.round(payload.value / 1000)}k` : (
            <CountUp end={Math.round(payload.value / 1000)} duration={1.2} delay={index * 0.08} suffix="k" />
          )}
        </div>

        {/* The Bar component itself */}
        <motion.div
          className="w-[calc(100%-16px)] mx-auto relative rounded-t-xl overflow-hidden"
          initial={hasAnimated ? false : { height: 0 }}
          animate={{
            height: height,
            scaleY: isHovered ? 1.05 : 1,
            scaleX: isHovered ? 1.03 : 1,
            originY: 1
          }}
          transition={{
            height: hasAnimated ? { duration: 0 } : {
              duration: 0.6,
              delay: index * 0.08,
              ease: "easeOut"
            },
            scaleY: { type: "spring", stiffness: 300, damping: 20 },
            scaleX: { type: "spring", stiffness: 300, damping: 20 }
          }}
          style={{
            background: isHovered 
              ? "linear-gradient(to top, rgba(20, 93, 160, 0.75), rgba(59, 130, 246, 0.9))"
              : "linear-gradient(to top, rgba(20, 93, 160, 0.3), rgba(59, 130, 246, 0.55))",
            boxShadow: isHovered 
              ? "0 0 25px rgba(59, 130, 246, 0.35)"
              : "none",
            borderLeft: isHovered ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRight: isHovered ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: isHovered ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid rgba(255, 255, 255, 0.12)",
            opacity: isDimmed ? 0.35 : 1,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)"
          }}
        >
          {/* Glowing Top Highlight Edge */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#93C5FD] via-[#60A5FA] to-[#93C5FD] shadow-[0_0_8px_#3B82F6] opacity-90" />

          {/* Light sweep animation (runs once per hover) */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>
    </foreignObject>
  );
}, (prevProps, nextProps) => {
  const prevHovered = prevProps.hoveredIndex === prevProps.index;
  const nextHovered = nextProps.hoveredIndex === nextProps.index;
  const prevDimmed = prevProps.hoveredIndex !== null && prevProps.hoveredIndex !== prevProps.index;
  const nextDimmed = nextProps.hoveredIndex !== null && nextProps.hoveredIndex !== nextProps.index;

  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.hasAnimated === nextProps.hasAnimated &&
    prevHovered === nextHovered &&
    prevDimmed === nextDimmed
  );
});
CustomBar.displayName = 'CustomBar';

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedMonthData, setSelectedMonthData] = useState<any | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Set animation complete status after initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Clear hover state when tapping/clicking outside the chart (crucial for mobile/touch)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const container = document.getElementById('revenue-trend-chart-container');
      if (container && !container.contains(e.target as Node)) {
        setHoveredIndex(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Handle drill down click
  const handleBarClick = (index: number) => {
    const item = data[index];
    if (!item) return;

    const total = item.value;
    
    // Proportional breakdown simulation matching the exact clicked total
    const breakdown = [
      { 
        name: 'Implants', 
        value: Math.round(total * 0.366), 
        percentage: 36.6, 
        color: 'from-blue-500 to-[#3B82F6]' 
      },
      { 
        name: 'Root Canal Treatment (RCT)', 
        value: Math.round(total * 0.305), 
        percentage: 30.5, 
        color: 'from-purple-500 to-indigo-500' 
      },
      { 
        name: 'Consultations', 
        value: Math.round(total * 0.183), 
        percentage: 18.3, 
        color: 'from-emerald-500 to-teal-500' 
      },
      { 
        name: 'X-Ray & Diagnostics', 
        value: total - Math.round(total * 0.366) - Math.round(total * 0.305) - Math.round(total * 0.183), 
        percentage: 14.6, 
        color: 'from-amber-500 to-orange-500' 
      }
    ];

    setSelectedMonthData({
      monthName: item.label,
      totalValue: total,
      breakdown
    });
  };

  // Support tap on mobile (1st tap shows tooltip, 2nd tap opens modal)
  const handleBarPress = (index: number) => {
    if (hoveredIndex === index) {
      handleBarClick(index);
    } else {
      setHoveredIndex(index);
    }
  };

  const hasNoData = !data || data.length === 0 || data.every(d => d.value === 0);

  return (
    <div id="revenue-trend-chart-container" className="w-full relative">
      {/* Self-contained CSS Grid Line Pulse effect */}
      <style jsx global>{`
        @keyframes gridLinePulse {
          0%, 100% { stroke: rgba(255, 255, 255, 0.03); }
          50% { stroke: rgba(255, 255, 255, 0.08); }
        }
        .animated-grid line {
          animation: gridLinePulse 6s infinite ease-in-out;
        }
      `}</style>

      {/* Ambient background particles */}
      <ParticleBackground />

      {hasNoData ? (
        <EmptyState />
      ) : (
        <div className="w-full overflow-x-auto scrollbar-thin select-none">
          <div className="min-w-[500px] sm:min-w-[580px] md:min-w-full h-60 relative z-10 overflow-visible">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 25, right: 10, left: -25, bottom: 0 }}
                onMouseLeave={() => setHoveredIndex(null)}
                className="overflow-visible"
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  className="animated-grid"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 9, fontWeight: 'bold' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  dx={-10}
                />
                <Bar
                  dataKey="value"
                  shape={
                    <CustomBar
                      hoveredIndex={hoveredIndex}
                      setHoveredIndex={setHoveredIndex}
                      onClickBar={handleBarPress}
                      data={data}
                      hasAnimated={hasAnimated}
                    />
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Drill-down modal */}
      <AnimatePresence>
        {selectedMonthData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 no-print">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMonthData(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Dialog container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-sm bg-[#090E1A]/95 border border-white/10 rounded-[28px] p-6 shadow-3xl overflow-hidden text-white"
              style={{
                boxShadow: "0 20px 45px rgba(0,0,0,0.65), 0 0 30px rgba(59,130,246,0.15)"
              }}
            >
              {/* Glowing header accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6]/60 to-transparent" />

              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-5">
                <div>
                  <h4 className="font-extrabold text-base text-white">Revenue Breakdown</h4>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{selectedMonthData.monthName}</span>
                </div>
                <button
                  onClick={() => setSelectedMonthData(null)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* List items */}
              <div className="space-y-4">
                {selectedMonthData.breakdown.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-semibold">{item.name}</span>
                      <span className="text-white font-extrabold">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                      />
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Total Revenue</span>
                  <span className="text-base font-black text-[#3B82F6]">
                    ₹{selectedMonthData.totalValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
