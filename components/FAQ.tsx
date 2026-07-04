"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How long does it take to see results?",
    a: "For Paid Ads (Google/Meta), we typically launch within 7-14 days, and you can expect to see initial results within the first month. For SEO and organic strategies, meaningful growth compounds over 3-6 months as we build authority."
  },
  {
    q: "Do you require long-term contracts?",
    a: "No. We believe in earning your business every month. Our engagements are typically rolling month-to-month after an initial 3-month setup and optimization period."
  },
  {
    q: "Will I have a dedicated account manager?",
    a: "Absolutely. You'll be assigned a dedicated Growth Strategist who deeply understands your industry, leads your campaigns, and acts as your direct point of contact for weekly check-ins."
  },
  {
    q: "How is ZenFix different from other agencies?",
    a: "We are radically transparent and ROI-focused. We don't hide behind vanity metrics like 'impressions' or 'clicks'. We tie every marketing dollar spent directly to revenue, leads, and sales."
  },
  {
    q: "Do you work with startups or only enterprises?",
    a: "We partner with ambitious brands of all sizes. From well-funded startups looking to scale aggressively, to established enterprises needing complex funnel automation, we have tailored solutions."
  },
  {
    q: "What industries do you specialize in?",
    a: "We have deep expertise across e-commerce, B2B SaaS, technology, healthcare, finance, and consumer goods. Our data-driven approach adapts to any industry with measurable goals."
  },
  {
    q: "Can you help with website development too?",
    a: "Yes! We offer full-stack web development services including custom websites, web applications, landing pages, and e-commerce platforms optimized for conversion and performance."
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48 relative bg-surface overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm font-bold tracking-widest text-electric-cyan uppercase mb-4"
          >
            FAQ
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white mb-6"
          >
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Questions</span>
          </motion.h3>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto lg:max-w-none 2xl:max-w-[1400px]">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className={`gradient-border rounded-2xl transition-all duration-300 ${
                openIdx === idx ? "border-electric-cyan/50" : "border-white/10"
              }`}
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
              >
                <span className="text-lg md:text-xl font-bold text-white pr-8">{faq.q}</span>
                <motion.div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    openIdx === idx ? "bg-electric-cyan/20 text-electric-cyan rotate-180" : "bg-white/5 text-gray-400"
                  }`}
                  animate={{ rotate: openIdx === idx ? 180 : 0 }}
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="p-6 md:p-8 pt-0 text-gray-400 text-lg leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
