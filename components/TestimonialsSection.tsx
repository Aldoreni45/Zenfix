"use client";

import { motion } from "framer-motion";
import TestimonialCard from "./TestimonialCard";
import { testimonials } from "../data/testimonials";

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/4 -left-[300px] w-[600px] h-[600px] bg-purple/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-[300px] w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10 mb-16 md:mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-electric-cyan/30 bg-electric-cyan/5 text-electric-cyan mb-6"
            >
              <span className="text-xs font-bold tracking-widest uppercase">Client Success Stories</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight"
            >
              Don't Just Take Our <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Word For It</span>
            </motion.h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-5"
          >
            <div className="text-right">
              <div className="text-4xl font-bold text-white">4.9/5</div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-1">Average Rating</div>
            </div>
            <div className="w-16 h-16 rounded-full glass border border-electric-cyan/30 flex items-center justify-center text-electric-cyan text-2xl">
              ★
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden flex pb-16">
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
        
        <div className="flex animate-marquee hover:pause gap-8 px-4">
          {[...testimonials, ...testimonials, ...testimonials].map((testimonial, idx) => (
            <TestimonialCard key={idx} testimonial={testimonial} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(calc(-33.33% - 10px)); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}