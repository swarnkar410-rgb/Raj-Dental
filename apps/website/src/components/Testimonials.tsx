'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  name: string;
  rating: number;
  date: string;
  text: string;
  treatment: string;
}

export default function Testimonials() {
  const reviews: Review[] = [
    {
      name: 'Rohan Sinha',
      rating: 5,
      date: '2 weeks ago',
      text: 'I got dental implants from Dr. Manoj Kumar. The procedure was completely pain-free, and the results are amazing. My tooth looks and feels completely natural. The hospital is very premium and clean.',
      treatment: 'Dental Implants'
    },
    {
      name: 'Dr. Shalini Prasad',
      rating: 5,
      date: '1 month ago',
      text: 'Highly professional experience. Dr. Manoj is extremely skilled and explained the entire digital smile design process to me. Highly recommend Raj Dental for anyone looking for cosmetic dentistry in Patna.',
      treatment: 'Smile Designing'
    },
    {
      name: 'Vikram Kumar',
      rating: 5,
      date: '3 weeks ago',
      text: 'Excellent root canal treatment. I was scared of the pain, but the single sitting laser RCT was extremely comfortable and finished within 45 minutes. Transparent pricing and professional staff.',
      treatment: 'Root Canal Treatment (RCT)'
    },
    {
      name: 'Anjali Singh',
      rating: 5,
      date: '2 months ago',
      text: 'Got braces for my daughter. Dr. Manoj suggested invisible aligners. They are highly comfortable and we are seeing great progress already. Very thankful to the team.',
      treatment: 'Braces Treatment'
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section id="testimonials" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#145DA0]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
          >
            <span className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest">Reviews</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            What Our Patients Say
          </motion.h2>
          <div className="w-12 h-1 bg-[#3B82F6] mx-auto rounded-full" />
        </div>

        {/* Carousel box */}
        <div className="relative glass-panel p-8 sm:p-12 rounded-3xl shadow-2xl min-h-[280px] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-6 right-8 text-white/5 pointer-events-none">
            <Quote size={120} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 relative z-10"
            >
              {/* Rating stars */}
              <div className="flex space-x-1">
                {[...Array(reviews[activeIndex].rating)].map((_, i) => (
                  <Star key={i} size={18} className="fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>

              {/* Review text */}
              <p className="text-white text-base sm:text-lg italic font-medium leading-relaxed">
                "{reviews[activeIndex].text}"
              </p>

              {/* Patient Author info */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div>
                  <div className="font-extrabold text-white text-sm sm:text-base">{reviews[activeIndex].name}</div>
                  <div className="text-gray-400 text-[10px] sm:text-xs uppercase font-semibold tracking-wider mt-0.5">{reviews[activeIndex].date}</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs text-[#3B82F6] font-bold">
                  {reviews[activeIndex].treatment}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <div className="flex justify-end items-center space-x-3 mt-6">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer hover:border-white/20 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer hover:border-white/20 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
