"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTABanner() {
  return (
    <section className="py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48 relative bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-electric-cyan/20 via-royal-blue/20 to-purple/20 rounded-full blur-[200px] pointer-events-none" />
      
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative gradient-border rounded-[40px] p-12 md:p-16 lg:p-24 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/10 via-royal-blue/10 to-purple/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-electric-cyan/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center gap-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-cyan to-royal-blue mb-8 animate-pulse-glow"
            >
              <Sparkles size={32} className="text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-heading font-bold text-white leading-tight mb-6"
            >
              Ready to Transform Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Digital Presence?</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-base md:text-lg lg:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
            >
              Join hundreds of businesses that have scaled their growth with our data-driven marketing strategies. Let's build something extraordinary together.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="#contact"
                className="group relative inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-electric-cyan to-royal-blue text-white font-bold text-base md:text-lg rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl min-h-[52px]"
              >
                <span>Start Your Journey</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="#portfolio"
                className="group relative inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/20 text-white font-bold text-base md:text-lg rounded-2xl overflow-hidden transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] min-h-[52px]"
              >
                <span>View Our Work</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
