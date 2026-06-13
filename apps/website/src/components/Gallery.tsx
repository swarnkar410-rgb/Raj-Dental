'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, ZoomIn } from 'lucide-react';

import clinic1 from '../../../../assets/clinic/Clinic1.jpeg';
import clinic2 from '../../../../assets/clinic/Clinic2.jpeg';
import clinic3 from '../../../../assets/clinic/Clinic3.jpeg';
import drManoj1 from '../../../../assets/doctors/Dr manoj.jpeg';
import drManoj2 from '../../../../assets/doctors/Dr Manoj2.jpeg';
import patientBefore1 from '../../../../assets/patients/before1.jpeg';
import patientAfter1 from '../../../../assets/patients/after1.jpeg';
import patientBefore2 from '../../../../assets/patients/Before2.jpeg';
import patientAfter2 from '../../../../assets/patients/after2.jpeg';
import certificate1 from '../../../../assets/certificates/Certificate1.jpeg';
import certificate2 from '../../../../assets/certificates/Certificate2.jpeg';
import certificate3 from '../../../../assets/certificates/Certificate3jpeg.jpeg';

interface GalleryItem {
  id: number;
  category: 'Clinic' | 'Doctors' | 'Certificates' | 'Patients';
  title: string;
  imgUrl: string;
}

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const categories = ['All', 'Clinic', 'Doctors', 'Patients', 'Certificates'];

  const getImgSrc = (img: any): string => (img && typeof img === 'object' && 'src' in img) ? img.src : img;

  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      category: 'Clinic',
      title: 'Clinic Lobby & Reception',
      imgUrl: getImgSrc(clinic1)
    },
    {
      id: 2,
      category: 'Clinic',
      title: 'Modern Clinic Setup',
      imgUrl: getImgSrc(clinic2)
    },
    {
      id: 3,
      category: 'Clinic',
      title: 'Advanced Treatment Room',
      imgUrl: getImgSrc(clinic3)
    },
    {
      id: 4,
      category: 'Doctors',
      title: 'Dr. Manoj Kumar',
      imgUrl: getImgSrc(drManoj1)
    },
    {
      id: 5,
      category: 'Doctors',
      title: 'Dr. Manoj Kumar - Clinical Session',
      imgUrl: getImgSrc(drManoj2)
    },
    {
      id: 6,
      category: 'Patients',
      title: 'Smile Alignment (Before)',
      imgUrl: getImgSrc(patientBefore1)
    },
    {
      id: 7,
      category: 'Patients',
      title: 'Smile Alignment (After)',
      imgUrl: getImgSrc(patientAfter1)
    },
    {
      id: 8,
      category: 'Patients',
      title: 'Dental Implant Restoration (Before)',
      imgUrl: getImgSrc(patientBefore2)
    },
    {
      id: 9,
      category: 'Patients',
      title: 'Dental Implant Restoration (After)',
      imgUrl: getImgSrc(patientAfter2)
    },
    {
      id: 10,
      category: 'Certificates',
      title: 'Clinic Accreditation Certificate',
      imgUrl: getImgSrc(certificate1)
    },
    {
      id: 11,
      category: 'Certificates',
      title: 'Dental Seminar Qualification',
      imgUrl: getImgSrc(certificate2)
    },
    {
      id: 12,
      category: 'Certificates',
      title: 'Official Clinical Recognition',
      imgUrl: getImgSrc(certificate3)
    }
  ];

  const filteredItems = selectedCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
    <section id="gallery" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest">Visual Tour</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Clinic Gallery</h2>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto rounded-full" />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all uppercase cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-black shadow-[0_4px_15px_rgba(212,175,55,0.3)]'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxItem(item)}
              className="relative group aspect-[4/3] rounded-2xl overflow-hidden glass-panel p-1.5 shadow-xl cursor-zoom-in select-none"
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-white/5">
                <img
                  src={item.imgUrl}
                  alt={item.title}
                  className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                    item.id === 4 ? 'object-contain bg-[#070C16]' : 'object-cover'
                  } ${
                    item.category !== 'Certificates' ? 'smooth-image' : ''
                  }`}
                  loading="lazy"
                />
                {/* Hover overlay details */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">{item.category}</span>
                  <h4 className="text-white font-extrabold text-base mt-1 flex items-center justify-between">
                    <span>{item.title}</span>
                    <ZoomIn size={18} />
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxItem(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all border border-white/15"
            onClick={() => setLightboxItem(null)}
          >
            <X size={24} />
          </button>
          <div className="max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl relative border border-white/10">
            <img 
              src={lightboxItem.imgUrl} 
              alt="Enlarged view" 
              className={`object-contain max-h-[80vh] w-full ${
                lightboxItem.category !== 'Certificates' ? 'smooth-image' : ''
              }`}
            />
          </div>
        </div>
      )}
    </section>
  );
}
