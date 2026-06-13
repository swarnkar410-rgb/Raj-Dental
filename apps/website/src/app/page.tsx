'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Trust from '../components/Trust';
import Services from '../components/Services';
import AboutDoctor from '../components/AboutDoctor';
import TreatmentExplorer from '../components/TreatmentExplorer';
import BeforeAfter from '../components/BeforeAfter';
import Testimonials from '../components/Testimonials';
import Gallery from '../components/Gallery';
import FAQ from '../components/FAQ';
import BookingForm from '../components/BookingForm';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function Home() {
  const [activeTreatment, setActiveTreatment] = useState('Dental Implants');

  const handleSelectTreatment = (treatment: string) => {
    setActiveTreatment(treatment);
    const element = document.getElementById('treatment-explorer');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1220] text-white selection:bg-[#3B82F6]/30 selection:text-white">
      {/* Premium Gradient glows in the absolute background of layout */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-[#145DA0]/10 via-[#3B82F6]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Main Structural Components */}
      <Header />
      <Hero />
      <Trust />
      <Services onSelectTreatment={handleSelectTreatment} />
      <AboutDoctor />
      <TreatmentExplorer activeTreatment={activeTreatment} setActiveTreatment={setActiveTreatment} />
      <BeforeAfter />
      <Testimonials />
      <Gallery />
      <FAQ />
      <BookingForm />
      <Contact />
      <Footer />
    </main>
  );
}
