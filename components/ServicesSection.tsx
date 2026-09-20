"use client";

import { motion } from "framer-motion";
import { Search, MousePointerClick, Megaphone, PenTool, LayoutDashboard, Bot, Smartphone, Palette, Mail, BarChart3, Globe, MessageSquare, Code, Target, Zap, Users } from "lucide-react";

const services = [
  {
    title: "SEO Optimization",
    desc: "Improve search visibility and drive qualified organic traffic.",
    icon: Search,
  },
  {
    title: "Google Ads",
    desc: "Target high-intent customers with performance-focused PPC.",
    icon: MousePointerClick,
  },
  {
    title: "Meta Ads",
    desc: "Reach the right audience with conversion-focused social campaigns.",
    icon: Megaphone,
  },
  {
    title: "Social Media Management",
    desc: "Build your brand with engaging content and community management.",
    icon: Users,
  },
  {
    title: "Lead Generation",
    desc: "Generate qualified leads that grow your sales pipeline.",
    icon: Target,
  },
  {
    title: "Website Development",
    desc: "Fast, responsive websites built for performance and conversion.",
    icon: LayoutDashboard,
  },
  {
    title: "Web Application Development",
    desc: "Scalable web applications tailored to your business needs.",
    icon: Code,
  },
  {
    title: "Mobile App Development",
    desc: "Native and cross-platform mobile applications with seamless UX.",
    icon: Smartphone,
  },
  {
    title: "Brand Identity",
    desc: "Comprehensive branding that defines your unique market position.",
    icon: Palette,
  },
  {
    title: "Content Marketing",
    desc: "Authority-building content that engages your audience.",
    icon: PenTool,
  },
  {
    title: "Email Marketing",
    desc: "Automated campaigns that nurture leads and drive conversions.",
    icon: Mail,
  },
  {
    title: "Marketing Automation",
    desc: "AI-powered automation that saves time and boosts results.",
    icon: Bot,
  },
  {
    title: "Performance Marketing",
    desc: "Data-driven campaigns focused on measurable ROI and growth.",
    icon: BarChart3,
  },
  {
    title: "Analytics & Reporting",
    desc: "Actionable insights that optimize your marketing performance.",
    icon: Zap,
  },
  {
    title: "Local SEO",
    desc: "Dominate local search and attract nearby customers.",
    icon: Globe,
  },
  {
    title: "AI Chatbots",
    desc: "24/7 intelligent customer support and lead qualification.",
    icon: MessageSquare,
  },
  {
    title: "CRM Integration",
    desc: "Unify marketing, sales, and customer data seamlessly.",
    icon: LayoutDashboard,
  },
  {
    title: "Landing Page Design",
    desc: "High-converting pages optimized for campaigns and leads.",
    icon: Target,
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-20 lg:py-24 xl:py-32 2xl:py-40 relative bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 lg:mb-20 xl:mb-24 2xl:mb-28 gap-6 md:gap-8">
          <div className="max-w-xl md:max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-bold tracking-widest text-electric-cyan uppercase mb-3 md:mb-4"
            >
              Our Services
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight"
            >
              Comprehensive Digital <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Growth Solutions</span>
            </motion.h3>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-gray-400 max-w-md text-base md:text-lg">
              We offer end-to-end digital marketing and development services designed to accelerate your business growth and maximize ROI.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-6 max-w-[1600px] mx-auto">
          {services.map((service, idx) => {
            const Icon = service.icon;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-xl p-4 flex flex-col min-h-[220px] max-h-[260px] hover:-translate-y-3 transition-transform duration-200 hover:border-electric-cyan/50 hover:shadow-[0_8px_24px_-8px_rgba(6,182,212,0.3)]"
                whileHover={{ 
                  scale: 1.01,
                }}
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 flex items-center justify-center mb-3 border border-electric-cyan/30 group-hover:border-electric-cyan/50 transition-colors duration-200">
                    <Icon className="text-electric-cyan w-5 h-5" />
                  </div>
                  
                  <h4 className="text-base font-bold text-white mb-2 group-hover:text-electric-cyan transition-colors duration-200">{service.title}</h4>
                  
                  <p className="text-sm text-gray-400 leading-relaxed flex-grow group-hover:text-gray-300 transition-colors duration-200">
                    {service.desc}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-electric-cyan uppercase tracking-wider mt-auto pt-3 cursor-pointer group-hover:text-royal-blue transition-colors duration-200">
                    <span>Learn More</span>
                    <span className="text-electric-cyan group-hover:text-royal-blue transition-colors duration-200">→</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}