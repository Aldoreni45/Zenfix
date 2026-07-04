"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Rocket, Target, ShieldCheck, Zap, HeartHandshake, Award, Clock, DollarSign, Users, TrendingUp, Lightbulb } from "lucide-react";

const features = [
  { icon: Award, title: "Certified Experts", desc: "Our team consists of certified professionals with years of experience in digital marketing and development." },
  { icon: Target, title: "ROI Focused", desc: "Every strategy we deploy is relentlessly optimized for maximizing your return on investment." },
  { icon: ShieldCheck, title: "Transparent Reporting", desc: "Full visibility into your metrics with custom dashboards. No hidden fees, no vanity metrics." },
  { icon: BrainCircuit, title: "AI Powered", desc: "We leverage advanced AI to identify market gaps and optimize your campaigns in real-time." },
  { icon: TrendingUp, title: "Latest Technologies", desc: "We stay ahead of the curve with cutting-edge tools and technologies for maximum impact." },
  { icon: HeartHandshake, title: "Dedicated Team", desc: "You get a dedicated team that deeply understands your business goals and objectives." },
  { icon: DollarSign, title: "Affordable Pricing", desc: "Premium services at competitive prices with flexible packages to fit your budget." },
  { icon: Clock, title: "24/7 Support", desc: "Round-the-clock support to ensure your campaigns run smoothly and efficiently." },
  { icon: Lightbulb, title: "Creative Strategy", desc: "Innovative and creative strategies that set you apart from the competition." },
  { icon: Rocket, title: "Rapid Results", desc: "We move fast. Campaigns are launched, tested, and optimized with unparalleled speed." },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-20 lg:py-24 xl:py-32 2xl:py-40 relative bg-surface overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-royal-blue/5 rounded-full blur-[200px] pointer-events-none" />
      
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="text-center max-w-2xl md:max-w-3xl mx-auto mb-12 md:mb-16 lg:mb-20 xl:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm font-bold tracking-widest text-electric-cyan uppercase mb-3 md:mb-4"
          >
            Why Choose Us
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight mb-4 md:mb-6"
          >
            Why Industry Leaders <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Choose ZenFix</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg lg:text-xl text-gray-400"
          >
            We don't just sell services; we architect growth systems. 
            Here's what makes our agency the competitive advantage you've been looking for.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group relative gradient-border p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/5 via-royal-blue/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <motion.div 
                  className="w-10 h-10 md:w-12 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 flex items-center justify-center mb-3 md:mb-4 lg:mb-6 border border-electric-cyan/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                  whileHover={{ scale: 1.1, rotate: 6 }}
                >
                  <Icon className="text-electric-cyan group-hover:text-royal-blue transition-colors w-5 h-5 md:w-6 md:h-7" />
                </motion.div>
                
                <h3 className="text-sm md:text-base lg:text-xl font-bold text-white mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-electric-cyan group-hover:to-royal-blue transition-colors">{feature.title}</h3>
                <p className="text-[11px] md:text-xs lg:text-sm text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
