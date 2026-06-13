'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, GraduationCap, CheckCircle2, HeartHandshake } from 'lucide-react';

export default function AboutDoctor() {
  const specs = [
    'Advanced Dental Implants (Single/Multiple/All-on-4)',
    'Cosmetic Smile Makeover & Veneers',
    'Laser Dentistry & Painless Root Canals',
    'Full Mouth Rehabilitation & Bridges'
  ];

  return (
    <section id="about-doctor" className="py-24 bg-[#0B1220] relative overflow-hidden z-20">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#145DA0]/20 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
          >
            <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest">Leadership</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            Meet Our Founder & Chief Surgeon
          </motion.h2>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Doctor Image Block */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative group w-80 sm:w-96 aspect-[4/5] rounded-3xl overflow-hidden glass-panel-gold p-2 shadow-2xl">
              {/* Gold pulsing border */}
              <div className="absolute inset-0 border-2 border-[#D4AF37]/30 rounded-3xl group-hover:border-[#D4AF37]/60 transition-all duration-300 pointer-events-none" />
              
              {/* Image Frame */}
              <div className="w-full h-full rounded-2xl overflow-hidden relative">
                {/* Fallback pattern in case image loads slow */}
                <div className="absolute inset-0 bg-[#0B1220] flex items-center justify-center">
                  <span className="text-gray-400 font-bold">Dr. Manoj Kumar</span>
                </div>
                
                {/* Dr Manoj image */}
                <img
                  src="/images/dr_manoj.png"
                  alt="Dr. Manoj Kumar - Chief Dentist"
                  className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-105 smooth-image"
                  onError={(e) => {
                    // Fallback to solid color if missing
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent z-15 opacity-60" />
              </div>

              {/* Float Experience Badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] px-5 py-3 rounded-2xl border border-white/15 shadow-xl text-center z-20">
                <span className="block text-xl font-bold text-white leading-none">17+</span>
                <span className="text-[10px] text-gray-200 tracking-wider font-semibold uppercase leading-tight">Years Exp</span>
              </div>
            </div>
          </motion.div>

          {/* Doctor Details Block */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="space-y-3">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Dr. Manoj Kumar</h3>
              <p className="text-[#D4AF37] font-semibold text-lg flex items-center gap-2">
                BDS, MDS (Prosthodontics & Implantology), FICOI (USA)
              </p>
              <div className="h-[1px] bg-white/10 w-full" />
            </div>

            <p className="text-gray-300 leading-relaxed text-base">
              Dr. Manoj Kumar is a highly distinguished implantologist and cosmetic dental surgeon with over 17 years of surgical experience. Since establishing Raj Dental & Implant Hospital in 2009, he has successfully restored thousands of confidences using pain-free techniques and advanced laser systems.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <GraduationCap className="text-[#3B82F6] flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-white text-sm">BDS – SRIHER</h4>
                  <p className="text-xs text-gray-400">Sri Ramachandra Institute of Higher Education and Research (SRIHER)</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <Award className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-white text-sm">Pioneer in Patna</h4>
                  <p className="text-xs text-gray-400">First to introduce advanced pain-free laser systems in Dariyapur region</p>
                </div>
              </div>
            </div>

            {/* Specializations List */}
            <div className="space-y-3">
              <h4 className="font-bold text-white tracking-wide text-sm uppercase">Key Core Specializations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center space-x-2.5 text-gray-300 text-sm">
                    <CheckCircle2 className="text-[#D4AF37] flex-shrink-0" size={16} />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
