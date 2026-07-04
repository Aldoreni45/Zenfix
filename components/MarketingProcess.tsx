"use client";

import { motion } from "framer-motion";

const process = [
  { step: "01", title: "Discovery", desc: "We deep-dive into your business, market position, and competitors to uncover untapped growth opportunities." },
  { step: "02", title: "Research", desc: "Comprehensive market research and audience analysis to inform data-driven strategies." },
  { step: "03", title: "Planning", desc: "Strategic planning with clear objectives, KPIs, and roadmap for successful execution." },
  { step: "04", title: "Design", desc: "Creative design and development of assets that resonate with your target audience." },
  { step: "05", title: "Development", desc: "Building robust marketing infrastructure with cutting-edge technology and tools." },
  { step: "06", title: "Marketing", desc: "Launch and execute multi-channel marketing campaigns for maximum impact." },
  { step: "07", title: "Optimization", desc: "Continuous A/B testing and algorithmic adjustments ensure your ROI scales efficiently." },
  { step: "08", title: "Growth", desc: "Scale successful campaigns and strategies to drive sustainable business growth." },
];

export default function MarketingProcess() {
  return (
    <section id="process" className="py-16 md:py-20 lg:py-24 xl:py-32 2xl:py-40 relative bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="text-center max-w-2xl md:max-w-3xl mx-auto mb-12 md:mb-16 lg:mb-20 xl:mb-24">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm font-bold tracking-widest text-electric-cyan uppercase mb-3 md:mb-4 inline-block"
          >
            Our Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight mb-4 md:mb-6"
          >
            The Blueprint to <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Growth</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg lg:text-xl text-gray-400"
          >
            We follow a proven, systematic process to engineer predictable growth for your brand.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
          {process.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group relative gradient-border p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/5 via-royal-blue/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <motion.div 
                  className="w-9 h-9 md:w-10 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 flex items-center justify-center mb-3 md:mb-4 lg:mb-6 border border-electric-cyan/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                  whileHover={{ scale: 1.1, rotate: 6 }}
                >
                  <span className="text-electric-cyan font-bold text-base md:text-lg lg:text-xl group-hover:text-royal-blue transition-colors">{item.step}</span>
                </motion.div>
                
                <h3 className="text-sm md:text-base lg:text-xl font-bold text-white mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-electric-cyan group-hover:to-royal-blue transition-colors">{item.title}</h3>
                <p className="text-[11px] md:text-xs lg:text-sm text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
