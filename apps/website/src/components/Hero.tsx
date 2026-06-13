'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Calendar, Phone } from 'lucide-react';

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  // Mouse parallax motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Transform mouse coordinates into smooth displacement offsets
  const toothX = useTransform(mouseX, [-500, 500], [-30, 30]);
  const toothY = useTransform(mouseY, [-500, 500], [-30, 30]);
  const glowX = useTransform(mouseX, [-500, 500], [-50, 50]);
  const glowY = useTransform(mouseY, [-500, 500], [-50, 50]);
  const particleX = useTransform(mouseX, [-500, 500], [40, -40]);
  const particleY = useTransform(mouseY, [-500, 500], [40, -40]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Center mouse origin
      const x = clientX - width / 2;
      const y = clientY - height / 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!mounted) return null;

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center pt-24 overflow-hidden bg-[#0B1220]">
      {/* Dynamic Animated Particles / Glow Balls */}
      <motion.div 
        style={{ x: glowX, y: glowY }}
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] rounded-full blur-[120px] animate-pulse-glow"
      />
      <motion.div 
        style={{ x: particleX, y: particleY }}
        className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-gradient-to-tr from-[#D4AF37] to-[#145DA0] rounded-full blur-[130px] opacity-20"
      />

      {/* Grid Pattern Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            <span className="text-xs text-gray-300 font-semibold uppercase tracking-wider">Trusted Dental Care Since 2009</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Raj Dental &<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] via-[#93C5FD] to-[#D4AF37]">
              Implant Hospital
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-gray-300 text-lg md:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Advanced Dental Implant, Cosmetic & Laser Dentistry led by{' '}
            <span className="text-white font-semibold underline decoration-[#D4AF37] decoration-2">Dr. Manoj Kumar</span>. Helping Patients Smile Confidently Again.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button
              onClick={() => scrollToSection('book-appointment')}
              className="flex items-center justify-center space-x-3 px-8 py-4 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1975c7] hover:to-[#5ea0ff] text-white font-bold tracking-wide shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_8px_35px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all cursor-pointer"
            >
              <Calendar size={20} />
              <span>Book Appointment</span>
            </button>
            <a
              href="tel:+919199419594"
              className="flex items-center justify-center space-x-3 px-8 py-4 w-full sm:w-auto rounded-2xl border border-white/10 hover:border-[#D4AF37]/50 bg-white/5 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
            >
              <Phone size={20} className="text-[#D4AF37]" />
              <span>Call +91 91994 19594</span>
            </a>
          </motion.div>
        </div>

        {/* Hero Right Graphic */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          {/* Parallax Container */}
          <motion.div
            style={{ x: toothX, y: toothY }}
            className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center"
          >
            {/* Background Gradient Glow Behind the Tooth */}
            <div className="absolute w-60 h-60 rounded-full bg-gradient-to-tr from-[#145DA0]/40 to-[#3B82F6]/40 blur-3xl" />

            {/* Premium Gold Smile Curve Vector */}
            <svg
              className="absolute w-full h-full text-[#D4AF37] opacity-60 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 50 250 Q 200 350 350 250"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-pulse"
              />
              {/* Sparkles */}
              <path d="M 330 220 L 340 230 M 340 220 L 330 230" stroke="currentColor" strokeWidth="2" />
              <path d="M 70 220 L 80 230 M 80 220 L 70 230" stroke="currentColor" strokeWidth="2" />
            </svg>

            {/* Floating Animated 3D-styled SVG Tooth */}
            <motion.div className="animate-float z-10">
              <svg
                width="220"
                height="220"
                viewBox="0 0 200 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_15px_40px_rgba(59,130,246,0.3)] filter brightness-110"
              >
                {/* Tooth crown gradient */}
                <defs>
                  <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#E2F1FF" />
                    <stop offset="100%" stopColor="#AECFFF" />
                  </linearGradient>
                  <linearGradient id="rootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#AECFFF" />
                    <stop offset="100%" stopColor="#5B9DFF" />
                  </linearGradient>
                </defs>

                {/* Left Crown part */}
                <path
                  d="M100,30 C60,20 20,40 25,110 C27,135 45,150 55,160 C65,170 68,185 70,210 C71,215 78,215 80,210 C85,185 92,175 100,175 C108,175 115,185 120,210 C122,215 129,215 130,210 C132,185 135,170 145,160 C155,150 173,135 175,110 C180,40 140,20 100,30 Z"
                  fill="url(#toothGrad)"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2.5"
                />

                {/* Shining Highlight overlay */}
                <path
                  d="M45,60 C40,90 45,120 60,135 C65,140 70,130 65,120 C55,110 50,85 55,60 C56,50 48,50 45,60 Z"
                  fill="#FFFFFF"
                  opacity="0.6"
                />
                
                {/* Implant/Crown indicator (Gold Accent ring around the crown to represent advanced implants) */}
                <path
                  d="M 25 110 Q 100 135 175 110"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Wave bottom transition divider */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B1220] to-transparent z-10" />
    </section>
  );
}
