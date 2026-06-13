'use client';

import React from 'react';
import { Phone, MapPin, Mail, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0B1220] text-gray-400 border-t border-white/5 py-16 relative z-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* About Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={scrollToTop}>
            <div className="relative w-8 h-8 flex-shrink-0">
              <img 
                src="/images/dr_manoj.png" 
                alt="Dr. Manoj Kumar" 
                className="w-8 h-8 rounded-lg object-cover object-top border border-white/10 shadow-md smooth-image" 
              />
              <div className="absolute -bottom-0.5 left-1 right-1 h-[2px] bg-[#D4AF37] rounded-full z-10"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-wide text-sm leading-tight">RAJ DENTAL</span>
              <span className="text-[8px] text-gray-500 tracking-wider font-semibold uppercase leading-none">Implant Hospital</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pt-2">
            Established in 2009. Dedicated to offering advanced cosmetic dentistry, teeth whitening, laser procedures, and dental implant restorations in Kadamkuan, Patna.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-bold text-white tracking-wide text-sm uppercase">Quick Links</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            {['services', 'about-doctor', 'treatment-explorer', 'smile-transform', 'testimonials', 'gallery', 'faq', 'contact'].map((item) => (
              <li key={item}>
                <button
                  onClick={() => scrollToSection(item)}
                  className="hover:text-white transition-colors capitalize text-left cursor-pointer"
                >
                  {item.replace('-', ' ')}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          <h4 className="font-bold text-white tracking-wide text-sm uppercase">Treatments</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            {['Dental Implants', 'Root Canal Treatment (RCT)', 'Smile Designing', 'Dental Crowns', 'Teeth Whitening', 'Clear Aligners'].map((t) => (
              <li key={t}>
                <button
                  onClick={() => scrollToSection('treatment-explorer')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <h4 className="font-bold text-white tracking-wide text-sm uppercase">Clinic Contact</h4>
          <ul className="space-y-3 text-xs sm:text-sm">
            <li className="flex items-start space-x-2.5">
              <MapPin size={16} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <span>Raj Sadan, Jahaji Kothi Rd, Dariyapur Gola, Salimpur Ahra, Kadamkuan, Patna, 800004</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Phone size={16} className="text-[#3B82F6] flex-shrink-0" />
              <a href="tel:+919199419594" className="hover:text-white transition-colors">+91 91994 19594</a>
            </li>
            <li className="flex items-center space-x-2.5">
              <Mail size={16} className="text-[#3B82F6] flex-shrink-0" />
              <span className="hover:text-white transition-colors">contact@rajdental.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
        <span className="text-xs text-gray-500 text-center sm:text-left">
          &copy; {new Date().getFullYear()} Raj Dental & Implant Hospital. All rights reserved. Dr. Manoj Kumar.
        </span>

        {/* Scroll back to top */}
        <button
          onClick={scrollToTop}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-white transition-colors p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer"
        >
          <ArrowUp size={14} />
          <span>Back to Top</span>
        </button>
      </div>
    </footer>
  );
}
