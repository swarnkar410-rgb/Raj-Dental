'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const faqs: FAQItem[] = [
    {
      question: 'Where is Raj Dental & Implant Hospital located?',
      answer: 'We are located at Raj Sadan, Jahaji Kothi Rd, Near Rajdhani Market, Dariyapur Gola, Salimpur Ahra, Kadamkuan, Patna, Bihar 800004. You can easily find us on Google Maps.'
    },
    {
      question: 'What are the clinic working hours?',
      answer: 'We are open Monday through Saturday from 09:30 AM to 07:30 PM. We are closed on Sundays for routine consultations, but emergency services can be coordinated by phone.'
    },
    {
      question: 'Is Dr. Manoj Kumar available every day?',
      answer: 'Yes, Dr. Manoj Kumar is our chief surgeon and leads all treatments. He is available during clinical hours. To ensure zero waiting time, we highly recommend booking an appointment online.'
    },
    {
      question: 'Do you offer card or digital payment options?',
      answer: 'Yes, we accept cash, all major credit/debit cards, bank transfers, and UPI digital payments (Google Pay, PhonePe, Paytm).'
    },
    {
      question: 'Is dental implant surgery painful?',
      answer: 'No, we utilize state-of-the-art local anesthesia and laser systems to ensure all implant placements and extractions are completely painless. Most patients experience minimal discomfort after the treatment.'
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#3B82F6]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest">Questions</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">FAQ Section</h2>
          <div className="w-12 h-1 bg-[#3B82F6] mx-auto rounded-full" />
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`rounded-2xl border transition-all ${
                  isOpen 
                    ? 'glass-panel border-[#3B82F6]/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-white/5' 
                    : 'glass-panel border-white/10 hover:border-white/20 bg-white/3'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 pr-4">
                    <HelpCircle className={`flex-shrink-0 ${isOpen ? 'text-[#3B82F6]' : 'text-gray-400'}`} size={18} />
                    <span className="font-bold text-white text-sm sm:text-base">{faq.question}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-[#3B82F6] text-white' : 'bg-white/5 text-gray-400'}`}>
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-white/5 text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
