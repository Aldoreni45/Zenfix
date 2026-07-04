"use client";

import { motion } from "framer-motion";
import { Target, Users, TrendingUp, Award, DollarSign, Eye } from "lucide-react";

const stats = [
  { icon: Target, value: "1000+", label: "Campaigns" },
  { icon: Users, value: "500+", label: "Happy Clients" },
  { icon: TrendingUp, value: "98%", label: "Retention" },
  { icon: Award, value: "12+", label: "Experts" },
  { icon: DollarSign, value: "$25M+", label: "Ad Spend" },
  { icon: Eye, value: "200M+", label: "Impressions" },
];

export default function AboutStatsSection() {
  return (
    <section id="about" className="py-32 relative overflow-hidden bg-cream">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate/10 to-transparent" />
      
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 xl:px-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm font-bold tracking-widest text-gold uppercase mb-4">Our Journey</h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-slate mb-8 leading-tight">
              Transforming Brands Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-pink">Market Leaders</span>
            </h3>
            
            <div className="space-y-6 text-slate-light text-lg md:text-xl">
              <p>
                ZenFix was born from a simple vision: to bridge the gap between creative marketing and data-driven results. 
                We don't just run campaigns; we engineer growth engines for ambitious brands.
              </p>
              <p>
                Our mission is to empower businesses with cutting-edge digital strategies, 
                turning every click into a client and every interaction into revenue.
              </p>
            </div>
            
            <div className="mt-12 flex gap-8">
              <div className="flex flex-col">
                <span className="text-4xl font-heading font-bold text-slate">10+</span>
                <span className="text-sm font-semibold text-slate-light uppercase tracking-wider">Years Experience</span>
              </div>
              <div className="w-px h-16 bg-slate/10" />
              <div className="flex flex-col">
                <span className="text-4xl font-heading font-bold text-slate">Top 1%</span>
                <span className="text-sm font-semibold text-slate-light uppercase tracking-wider">Agency Partners</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="glass-card p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:border-gold/30"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blush transition-all duration-300">
                    <Icon className="text-rose group-hover:text-gold transition-colors" size={28} />
                  </div>
                  <h4 className="text-2xl lg:text-3xl font-heading font-bold text-slate mb-2">{stat.value}</h4>
                  <p className="text-[11px] sm:text-xs text-slate-light font-bold uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
          
        </div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-pink/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
    </section>
  );
}