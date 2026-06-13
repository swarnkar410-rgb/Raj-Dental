import React from 'react';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Contact() {
  const address = 'Raj Sadan, Jahaji Kothi Rd, Near Rajdhani Market, Dariyapur Gola, Salimpur Ahra, Kadamkuan, Patna, Bihar 800004';
  const phone = '+91 91994 19594';
  const whatsappNum = process.env.NEXT_PUBLIC_CLINIC_WHATSAPP || '919199419594';
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=Hi%20Dr.%20Manoj,%20I'd%20like%20to%20inquire%20about%20a%20dental%20appointment.`;

  return (
    <section id="contact" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest">Connect</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Contact Us</h2>
          <div className="w-12 h-1 bg-[#3B82F6] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl border-white/10 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-black text-white">Raj Dental & Implant Hospital</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Trusted by Patna families since 2009 for implantology, braces, pain-free root canals, and cosmetic dental surgeries.
              </p>

              <div className="h-[1px] bg-white/10 my-4" />

              {/* Location */}
              <a 
                href="https://maps.google.com/?cid=9547074384954464116"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-3.5 group cursor-pointer"
              >
                <MapPin className="text-[#D4AF37] flex-shrink-0 mt-1 group-hover:text-white transition-colors" size={20} />
                <div>
                  <h4 className="font-extrabold text-white text-sm group-hover:text-[#3B82F6] transition-colors flex items-center gap-1.5">
                    <span>Clinic Location</span>
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-gray-300 text-xs sm:text-sm mt-0.5 leading-relaxed group-hover:text-white transition-colors">{address}</p>
                </div>
              </a>

              {/* Contact numbers */}
              <div className="flex items-start space-x-3.5">
                <Phone className="text-[#3B82F6] flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-extrabold text-white text-sm">Phone Hotline</h4>
                  <p className="text-gray-300 text-xs sm:text-sm mt-0.5">{phone}</p>
                </div>
              </div>

              {/* Timings */}
              <div className="flex items-start space-x-3.5">
                <Clock className="text-[#3B82F6] flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-extrabold text-white text-sm">Clinical Hours</h4>
                  <p className="text-gray-300 text-xs sm:text-sm mt-0.5">Mon - Sat: 09:30 AM - 07:30 PM</p>
                  <p className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-wider mt-0.5">Sunday Closed</p>
                </div>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5 w-full">
              {/* Call Hospital (Secondary CTA) */}
              <motion.a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-3 h-[56px] py-[14px] px-[24px] rounded-[16px] border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-300 cursor-pointer flex-1"
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
                transition={{ duration: 0.2 }}
              >
                <Phone className="w-6 h-6 shrink-0" />
                <span>Call Hospital</span>
              </motion.a>

              {/* WhatsApp Chat (Primary CTA) */}
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 h-[56px] py-[14px] px-[24px] rounded-[16px] bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-300 cursor-pointer flex-1"
                style={{ boxShadow: '0 0 20px rgba(37,211,102,0.15)' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(37,211,102,0.25)' }}
                transition={{ duration: 0.2 }}
                aria-label="Chat with Dr. Manoj on WhatsApp"
                title="Chat instantly on WhatsApp"
              >
                <FaWhatsapp className="w-6 h-6 shrink-0" />
                <span>WhatsApp Chat</span>
              </motion.a>
            </div>
          </div>

          {/* Embedded Google Maps Box */}
          <div className="lg:col-span-7 glass-panel p-2 rounded-3xl overflow-hidden min-h-[350px] shadow-2xl relative">
            <a 
              href="https://maps.google.com/?cid=9547074384954464116"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 left-4 z-10 bg-[#3B82F6] hover:bg-[#2563EB] border border-blue-400/30 px-3.5 py-2 rounded-xl flex items-center space-x-2 text-xs text-white font-bold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 cursor-pointer animate-pulse hover:animate-none"
            >
              <MapPin size={14} className="text-white" />
              <span>Open in Google Maps</span>
              <ExternalLink size={12} className="text-white/85" />
            </a>
            {/* Real embedded Google Maps iframe for Rajdhani Market / Kadamkuan / Patna area */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.7143731997717!2d85.1511946!3d25.6144058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed58f130965c25%3A0x847def03856f974!2sRaj+Dental+%26+Implant+Hospital!5e0!3m2!1sen!2sin!4v1717800000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '350px', borderRadius: '20px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
