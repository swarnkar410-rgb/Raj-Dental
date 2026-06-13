'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Info, Clock, ShieldCheck, HelpCircle } from 'lucide-react';

interface TreatmentExplorerProps {
  activeTreatment: string;
  setActiveTreatment: (treatmentName: string) => void;
}

interface TreatmentDetail {
  costRange: string;
  procedure: string;
  benefits: string[];
  recovery: string;
  faqs: { q: string; a: string }[];
}

export default function TreatmentExplorer({ activeTreatment, setActiveTreatment }: TreatmentExplorerProps) {
  const treatmentsData: { [key: string]: TreatmentDetail } = {
    'Dental Implants': {
      costRange: '₹15,000 - ₹25,000',
      procedure: 'State-of-the-art procedure involving surgical placement of a medical-grade titanium post into the jawbone. This serves as a root replacement, which merges with the bone over a few months (osseointegration) before receiving a custom zirconia crown.',
      benefits: ['Permanent solution that behaves like natural teeth', 'Prevents bone loss and preserves facial structure', 'No grinding of adjacent teeth required', '15+ years or lifetime durability with good hygiene'],
      recovery: ' Osseointegration takes 3 to 6 months. Temporary crown is worn initially. Minor soreness for 3-5 days post-surgery managed with pain relievers.',
      faqs: [
        { q: 'Is dental implant surgery painful?', a: 'The surgery is performed under local anesthesia and is completely painless. Post-operative discomfort is comparable to a simple extraction.' },
        { q: 'Am I a candidate for dental implants?', a: 'Candidates need healthy gums and adequate jawbone thickness. Dr. Manoj will take a CBCT scan to evaluate bone density before approval.' }
      ]
    },
    'Root Canal Treatment (RCT)': {
      costRange: '₹2,500 - ₹4,000',
      procedure: 'Saving a heavily decayed or infected tooth by removing the damaged pulp tissue, cleaning and shaping the inner root canals with advanced rotary endodontic files, sterilizing with lasers, and sealing it with obturation (gutta-percha). Often followed by a crown.',
      benefits: ['Stops throbbing dental pain immediately', 'Saves your natural tooth from extraction', 'Prevents infection spread in the jawbone', 'Highly successful, durable therapy'],
      recovery: '1-3 days of mild tenderness during chewing. Avoid hard foods on the treated side until the crown is cemented.',
      faqs: [
        { q: 'Can a root canal be completed in a single sitting?', a: 'Yes! Using our advanced rotary systems, most RCTs are completed in a single comfortable sitting of 45 minutes.' },
        { q: 'Why is a crown necessary after an RCT?', a: 'Root canal treated teeth lose their pulp blood supply, making them brittle over time. A crown provides structural reinforcement to prevent fractures.' }
      ]
    },
    'Smile Designing': {
      costRange: '₹15,000 - ₹50,000',
      procedure: 'A comprehensive cosmetic makeover using digital smile design previews, followed by placing hand-layered composite veneers or ultra-thin porcelain veneers over the prepared teeth to correct gaps, chips, stains, or spacing issues.',
      benefits: ['Achieves perfect teeth symmetry, color, and size', 'Minimal enamel preparation required for veneers', 'Stain-resistant materials keep your smile bright', 'Increases self-confidence instantly'],
      recovery: 'Virtually no downtime. Bonding is completed in 1-2 visits. Avoid biting hard objects directly with front teeth.',
      faqs: [
        { q: 'How long do porcelain veneers last?', a: 'Veneers last between 10 to 15 years with proper oral care and regular cleanings.' },
        { q: 'Is smile designing reversible?', a: 'Composite bonding is reversible, while porcelain veneers require minimal enamel modification and are permanent.' }
      ]
    },
    'Braces Treatment': {
      costRange: '₹16,000 - ₹40,000',
      procedure: 'Correcting crowded, crooked teeth or misaligned bites by applying gentle force. Options include traditional metal braces or aesthetic ceramic braces to align teeth and improve bite function.',
      benefits: ['Corrects malocclusion and chewing efficiency', 'Improves smile aesthetics and jawline alignment', 'Increases overall oral health', 'Easier teeth cleaning once aligned'],
      recovery: 'Mild pressure discomfort for 2-4 days after initial fitting or adjustment updates. Total treatment ranges from 6 to 18 months.',
      faqs: [
        { q: 'What is the best age for orthodontic braces?', a: 'While treatment can start around age 10-14, adults can get braces at any age as long as their bones and gums are healthy.' },
        { q: 'How often do I need appointments?', a: 'Braces require visits every 4-6 weeks for adjustments and monitoring.' }
      ]
    },
    'Dental Crowns': {
      costRange: '₹3,000 - ₹10,000',
      procedure: 'Rebuilding damaged teeth or replacing missing teeth by shaving the target tooth structure, taking a precision CAD/CAM scan, and cementing a custom-crafted Zirconia or porcelain-fused-to-metal (PFM) crown or bridge.',
      benefits: ['Restores full chewing power and chewing efficiency', 'Looks and feels identical to original teeth', 'Keeps surrounding teeth from shifting', 'Sturdy and highly wear-resistant'],
      recovery: 'Cementation is done over 2 appointments. Normal chewing can resume immediately after final cementation.',
      faqs: [
        { q: 'What is the difference between a crown and a bridge?', a: 'A crown caps a single damaged tooth. A bridge replaces one or more missing teeth by anchoring to the healthy teeth on either side.' },
        { q: 'How long do Zirconia crowns last?', a: 'Zirconia is virtually indestructible and easily lasts 15+ years with regular maintenance.' }
      ]
    },
    'Teeth Whitening': {
      costRange: '₹5,000 - ₹15,000',
      procedure: 'Laser-activated whitening. A high-concentration whitening gel is applied to the teeth surfaces, protecting gums, and activated by a specialized dental blue-light laser. The oxygen molecules break down deep enamel stains.',
      benefits: ['Brightens teeth up to 8 shades in 45 minutes', 'Safe for enamel under professional supervision', 'Removes deep tea, coffee, and tobacco stains', 'Ideal cosmetic boost before special events'],
      recovery: 'Temporary teeth sensitivity to cold and hot drinks for 24-48 hours. Avoid staining foods (like turmeric, red wine) for 48 hours.',
      faqs: [
        { q: 'Does whitening damage tooth enamel?', a: 'No. Clinical studies show that professional whitening is completely safe for enamel when done by a qualified dentist.' },
        { q: 'How long do whitening results last?', a: 'Results last 1 to 2 years, depending on dietary habits and brushing frequency.' }
      ]
    },
    'Tooth Extraction': {
      costRange: '₹500 - ₹5,000',
      procedure: 'Trauma-free removal of non-savable, fractured, or deeply decayed teeth. Wisdom teeth extractions often involve minor surgical exposure of the bone and placement of sutures under local anesthesia.',
      benefits: ['Eliminates severe infection and throbbing pain', 'Prevents crowding or decay of adjacent molars', 'Stops orthodontic relapse before aligner therapy', 'Painless surgical execution'],
      recovery: 'Sutures are removed in 7 days. Soft food diet for 3 days. Avoid spitting, smoking, or using straws for 24 hours to prevent dry socket.',
      faqs: [
        { q: 'What is a dry socket?', a: 'A dry socket is a painful condition where the blood clot in the extraction site is dislodged, exposing the bone. It is preventable by following aftercare rules.' },
        { q: 'When can I replace my extracted tooth?', a: 'Implant replacement planning can begin 2 to 3 months after the socket bone heals.' }
      ]
    },
    'Laser Dental Treatment': {
      costRange: '₹2,000 - ₹20,000',
      procedure: 'Employing focused laser wavelengths for delicate soft-tissue therapies: laser gingivectomy (gum reshaping), depigmentation of dark gums, cutting tongue-ties, or sterilizing root canals with zero contact.',
      benefits: ['Drastically reduces bleeding and swelling', 'No scalpel sutures or loud drill noises', 'Extremely sterile process with lower infection risks', 'Minimal post-operative pain and rapid healing'],
      recovery: 'Near-instant recovery. Gums heal within 24-48 hours. Minimal to no medication is required.',
      faqs: [
        { q: 'Is laser dentistry safe?', a: 'Yes, it is highly safe. Both the dentist and patient wear special protective eyewear during the laser operation.' },
        { q: 'Does laser treatment require injections?', a: 'Many minor laser procedures can be done without local anesthesia as the laser naturally desensitizes tissues.' }
      ]
    },
    'Clear Aligners': {
      costRange: '₹60,000 - ₹1,20,000',
      procedure: 'Orthodontic correction of crowded, spaced, or misaligned teeth using a sequence of custom-made, virtually invisible, medical-grade thermoplastic trays (aligners). Each set is worn for 1-2 weeks, gently shifting teeth into position based on a 3D digital treatment plan.',
      benefits: ['Virtually invisible and highly aesthetic', 'Removable for easy eating, brushing, and flossing', 'No painful metal brackets or poking wires', 'Fewer office visits required compared to traditional braces'],
      recovery: 'Mild tightness or pressure for 1-2 days when starting a new aligner set. Total treatment duration is typically 6 to 15 months.',
      faqs: [
        { q: 'How many hours a day must I wear the aligners?', a: 'Aligners should be worn for 20 to 22 hours daily, removing them only to eat, drink anything other than water, brush, and floss.' },
        { q: 'Are clear aligners suitable for everyone?', a: 'They are highly effective for most mild to moderate cases of crowding, gaps, and bite issues. Dr. Manoj will perform a 3D scan to confirm if you are a candidate.' }
      ]
    }
  };

  const currentDetail = treatmentsData[activeTreatment] || treatmentsData['Dental Implants'];

  const scrollToBooking = () => {
    const element = document.getElementById('book-appointment');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="treatment-explorer" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#3B82F6]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
          >
            <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest">Interactive Tool</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            Treatment Explorer & Cost Estimator
          </motion.h2>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto rounded-full" />
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Select a service below to explore clinical procedures, cost breakdowns, and recovery insights.
          </p>
        </div>

        {/* Treatment Tab Selectors */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {Object.keys(treatmentsData).map((treatment) => (
            <button
              key={treatment}
              onClick={() => setActiveTreatment(treatment)}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all border cursor-pointer ${
                activeTreatment === treatment
                  ? 'bg-gradient-to-r from-[#145DA0] to-[#3B82F6] border-[#3B82F6] text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-white/20'
              }`}
            >
              {treatment}
            </button>
          ))}
        </div>

        {/* Detailed Pane */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTreatment}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl border-white/10 relative"
          >
            {/* Gold highlight line on explorer card */}
            <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

            {/* Left detail column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-[#3B82F6] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Info size={14} /> The Procedure
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{activeTreatment}</h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{currentDetail.procedure}</p>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm uppercase tracking-wide">Key Benefits</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentDetail.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-300">
                      <ShieldCheck className="text-[#D4AF37] flex-shrink-0 mt-0.5" size={16} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recovery */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <h4 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <Clock size={16} className="text-[#3B82F6]" /> Recovery Timeline
                </h4>
                <p className="text-xs sm:text-sm text-gray-300">{currentDetail.recovery}</p>
              </div>
            </div>

            {/* Right Cost & FAQ column */}
            <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-white/10 lg:pl-8">
              {/* Cost widget */}
              <div className="bg-gradient-to-tr from-white/5 to-white/0 p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Treatment Cost</span>
                  <div className="text-3xl font-black text-white mt-1">{currentDetail.costRange}</div>
                </div>
                <button
                  onClick={scrollToBooking}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer text-center"
                >
                  Book Free Consultation
                </button>
                <span className="text-[10px] text-gray-400 block text-center italic">*Rates are guidelines. Dr. Manoj will provide final pricing after physical diagnosis.</span>
              </div>

              {/* FAQ */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <HelpCircle size={16} className="text-[#D4AF37]" /> Frequently Asked
                </h4>
                <div className="space-y-4">
                  {currentDetail.faqs.map((faq, idx) => (
                    <div key={idx} className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                      <h5 className="font-bold text-white text-xs sm:text-sm">Q: {faq.q}</h5>
                      <p className="text-gray-400 text-xs leading-relaxed">A: {faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
