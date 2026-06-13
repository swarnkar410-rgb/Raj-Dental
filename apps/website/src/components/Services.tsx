'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Sparkles, 
  Smile, 
  Activity, 
  Layers, 
  Zap, 
  Scissors, 
  Target 
} from 'lucide-react';

interface ServicesProps {
  onSelectTreatment: (treatmentName: string) => void;
}

export default function Services({ onSelectTreatment }: ServicesProps) {
  const services = [
    {
      title: 'Dental Implants',
      icon: <ShieldAlert className="text-[#3B82F6]" size={28} />,
      description: 'Permanent, natural-looking replacement of missing teeth utilizing state-of-the-art titanium implants.',
      badge: 'Popular'
    },
    {
      title: 'Root Canal Treatment (RCT)',
      icon: <Target className="text-[#3B82F6]" size={28} />,
      description: 'Painless single-sitting rotary RCTs to save infected teeth and eliminate toothache completely.',
      badge: 'Advanced'
    },
    {
      title: 'Smile Designing',
      icon: <Smile className="text-[#D4AF37]" size={28} />,
      description: 'Custom aesthetic veneers and cosmetic bonding to craft the perfect symmetry, shape, and shine.',
      badge: 'Luxury'
    },
    {
      title: 'Braces Treatment',
      icon: <Activity className="text-[#3B82F6]" size={28} />,
      description: 'Orthodontic alignment for kids and adults using modern braces to restore alignment and bite function.',
      badge: 'Classic'
    },
    {
      title: 'Dental Crowns',
      icon: <Layers className="text-[#3B82F6]" size={28} />,
      description: 'Highly durable zirconia and ceramic crowns to restore chewing efficiency and structure.',
      badge: 'Essential'
    },
    {
      title: 'Teeth Whitening',
      icon: <Sparkles className="text-[#D4AF37]" size={28} />,
      description: 'Instant laser whitening treatments designed to brighten your teeth up to 8 shades in one sitting.',
      badge: 'Express'
    },
    {
      title: 'Tooth Extraction',
      icon: <Scissors className="text-[#3B82F6]" size={28} />,
      description: 'Safe, traumatic and surgical removals of impacted wisdom teeth or non-savable dental roots.',
      badge: 'Surgical'
    },
    {
      title: 'Laser Dental Treatment',
      icon: <Zap className="text-[#D4AF37]" size={28} />,
      description: 'Advanced laser soft-tissue procedures for bleeding gums, root cleanings, and painless treatments.',
      badge: 'Pioneering'
    },
    {
      title: 'Clear Aligners',
      icon: <Sparkles className="text-[#D4AF37]" size={28} />,
      description: 'Virtually invisible, removable clear aligners to straighten your teeth comfortably and discreetly.',
      badge: 'Premium'
    }
  ];

  return (
    <section id="services" className="py-24 bg-[#0B1220] relative overflow-hidden z-20">
      {/* Background radial glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#145DA0]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
          >
            <span className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest">Treatments</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            Our Dental Services
          </motion.h2>
          <div className="w-12 h-1 bg-[#3B82F6] mx-auto rounded-full" />
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
            Experience complete, premium dental treatments with our advanced technologies and pain-free protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between h-[280px] shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:border-[#3B82F6]/40 relative group overflow-hidden"
            >
              {/* Border glow effect on card hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#145DA0]/0 to-[#3B82F6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-[#3B82F6]/10 transition-colors">
                    {service.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    service.badge === 'Luxury' || service.badge === 'Pioneering'
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                      : 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20'
                  }`}>
                    {service.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-white text-lg group-hover:text-[#3B82F6] transition-colors">{service.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{service.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center">
                <button
                  onClick={() => onSelectTreatment(service.title)}
                  className="text-xs font-bold text-gray-300 hover:text-white flex items-center space-x-1 group/btn cursor-pointer"
                >
                  <span>Learn Procedure & Cost</span>
                  <span className="transform translate-x-0 group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
