'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar } from 'lucide-react';
import logoLight from '../../../../assets/pms/logo-light.png';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy: update activeSection based on visible sections
  useEffect(() => {
    const sections = ['services', 'about-doctor', 'treatment-explorer', 'smile-transform', 'testimonials', 'gallery', 'faq', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'py-4 bg-[#0B1220]/80 backdrop-blur-md border-b border-white/10 shadow-lg' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative w-10 h-10 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <img 
              src={typeof logoLight === 'object' ? logoLight.src : logoLight} 
              alt="Raj Dental Logo" 
              className="w-full h-full object-contain" 
            />
            {/* Smile Curve representation */}
            <div className="absolute -bottom-1 left-2 right-2 h-[3px] bg-[#D4AF37] rounded-full z-10"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-wide text-lg leading-tight">RAJ DENTAL</span>
            <span className="text-[10px] text-gray-400 tracking-widest font-semibold uppercase leading-none">& Implant Hospital</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center lg:space-x-4 xl:space-x-6 2xl:space-x-8 flex-shrink">
          {['services', 'about-doctor', 'treatment-explorer', 'smile-transform', 'testimonials', 'gallery', 'faq', 'contact'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className={`text-xs xl:text-sm ${activeSection===item ? 'text-white bg-[#0B1220]/60 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'text-gray-300'} hover:text-white hover:shadow-[0_4px_10px_-4px_rgba(59,130,246,0.5)] transition-all duration-300 font-medium capitalize relative group cursor-pointer whitespace-nowrap`}
            >
              {item.replace('-', ' ')}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#3B82F6] transition-all duration-300 group-hover:w-full"></span>
            </button>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center space-x-3 xl:space-x-4 flex-shrink-0">
          <button
            onClick={() => scrollToSection('book-appointment')}
            className="flex items-center space-x-2 px-4 xl:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b71be] hover:to-[#4f8ff7] text-white text-xs xl:text-sm font-semibold shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Calendar size={14} className="flex-shrink-0" />
            <span className="whitespace-nowrap">Book Appointment</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0B1220] border-b border-white/10 shadow-2xl py-6 px-6 space-y-4 flex flex-col items-center animate-fadeIn">
          {['services', 'about-doctor', 'treatment-explorer', 'smile-transform', 'testimonials', 'gallery', 'faq', 'contact'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
                            className={`text-base ${activeSection===item ? 'text-white bg-[#0B1220]/60 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'text-gray-300'} hover:text-white hover:shadow-[0_4px_10px_-4px_rgba(59,130,246,0.5)] transition-all duration-300 capitalize font-medium py-2 w-full text-center`}
            >
              {item.replace('-', ' ')}
            </button>
          ))}
          <div className="w-full h-[1px] bg-white/10 my-2"></div>
          <button
            onClick={() => scrollToSection('book-appointment')}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white w-full text-center font-semibold text-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
          >
            <Calendar size={16} />
            <span>Book Appointment</span>
          </button>
        </div>
      )}
    </header>
  );
}
