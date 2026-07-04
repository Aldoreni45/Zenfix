"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Users, DollarSign } from "lucide-react";

const cases = [
  {
    client: "Nova Retail",
    industry: "E-Commerce",
    metric1: "+240%", label1: "Organic Traffic",
    metric2: "3.5x", label2: "ROAS",
    description: "Complete digital transformation for a leading e-commerce brand",
    color: "from-electric-cyan to-royal-blue"
  },
  {
    client: "Elevate SaaS",
    industry: "B2B Tech",
    metric1: "+180%", label1: "Lead Volume",
    metric2: "-45%", label2: "CPA",
    description: "B2B lead generation campaign for SaaS platform",
    color: "from-royal-blue to-purple"
  },
  {
    client: "TechFlow Inc",
    industry: "Technology",
    metric1: "+320%", label1: "Revenue",
    metric2: "4.2x", label2: "ROI",
    description: "Full-stack marketing automation implementation",
    color: "from-purple to-pink"
  },
  {
    client: "GreenLeaf Brands",
    industry: "Consumer Goods",
    metric1: "+195%", label1: "Brand Awareness",
    metric2: "2.8x", label2: "Engagement",
    description: "Social media and influencer marketing campaign",
    color: "from-electric-cyan to-purple"
  },
];

export default function CaseStudies() {
  return (
    <section id="portfolio" className="py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48 relative bg-surface overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-bold tracking-widest text-electric-cyan uppercase mb-4 inline-block"
            >
              Featured Projects
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight"
            >
              Don't Take Our Word For It. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Look at the Data.</span>
            </motion.h2>
          </div>
          <motion.a
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            href="#contact"
            className="inline-flex items-center gap-2 text-white hover:text-electric-cyan transition-colors pb-2 border-b border-white/20 hover:border-electric-cyan font-medium text-lg"
          >
            View All Case Studies <ArrowUpRight size={20} />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
          {cases.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group relative gradient-border rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/5 via-royal-blue/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-8 h-full flex flex-col">
                <div className="mb-6">
                  <span className="px-4 py-2 bg-gradient-to-r from-electric-cyan/20 to-royal-blue/20 rounded-full text-xs font-bold text-electric-cyan tracking-widest border border-electric-cyan/30 uppercase">
                    {item.industry}
                  </span>
                </div>
                
                <h3 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-electric-cyan group-hover:to-royal-blue transition-colors">{item.client}</h3>
                
                <p className="text-gray-400 text-sm mb-6 flex-grow">{item.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-royal-blue">{item.metric1}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{item.label1}</p>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-royal-blue to-purple">{item.metric2}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{item.label2}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
