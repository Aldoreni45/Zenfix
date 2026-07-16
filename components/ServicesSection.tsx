"use client";

import { motion } from "framer-motion";
import { Search, MousePointerClick, Megaphone, PenTool, LayoutDashboard, Bot, Smartphone, Palette, Mail, BarChart3, Globe, MessageSquare, Code, Target, Zap, Users } from "lucide-react";

const services = [
  {
    title: "SEO Optimization",
    desc: "Dominate search rankings with our data-driven SEO strategies that drive high-intent organic traffic.",
    icon: Search,
  },
  {
    title: "Google Ads",
    desc: "Precision-targeted PPC campaigns that maximize your ad spend and turn clicks into revenue.",
    icon: MousePointerClick,
  },
  {
    title: "Meta Ads",
    desc: "Scroll-stopping Facebook and Instagram campaigns engineered to capture attention and drive leads.",
    icon: Megaphone,
  },
  {
    title: "Social Media Management",
    desc: "Build your brand presence across all platforms with engaging content and community management.",
    icon: Users,
  },
  {
    title: "Lead Generation",
    desc: "High-converting lead generation strategies that fill your pipeline with qualified prospects.",
    icon: Target,
  },
  {
    title: "Website Development",
    desc: "Custom, responsive websites built for performance, speed, and exceptional user experience.",
    icon: LayoutDashboard,
  },
  {
    title: "Web Application Development",
    desc: "Scalable web applications tailored to your business needs with modern technologies.",
    icon: Code,
  },
  {
    title: "Mobile App Development",
    desc: "Native and cross-platform mobile applications that deliver seamless user experiences.",
    icon: Smartphone,
  },
  {
    title: "Brand Identity",
    desc: "Comprehensive branding solutions that define your unique identity and market position.",
    icon: Palette,
  },
  {
    title: "Content Marketing",
    desc: "Authority-building content that engages your audience and accelerates the buyer's journey.",
    icon: PenTool,
  },
  {
    title: "Email Marketing",
    desc: "Automated email campaigns that nurture leads and drive conversions at scale.",
    icon: Mail,
  },
  {
    title: "Marketing Automation",
    desc: "Streamline your marketing with AI-powered automation that saves time and boosts results.",
    icon: Bot,
  },
  {
    title: "Performance Marketing",
    desc: "Data-driven performance marketing campaigns focused on measurable ROI and growth.",
    icon: BarChart3,
  },
  {
    title: "Analytics & Reporting",
    desc: "Comprehensive analytics and reporting that provide actionable insights for optimization.",
    icon: Zap,
  },
  {
    title: "Local SEO",
    desc: "Dominate local search results and attract customers in your geographic area.",
    icon: Globe,
  },
  {
    title: "AI Chatbots",
    desc: "Intelligent chatbots that provide 24/7 customer support and lead qualification.",
    icon: MessageSquare,
  },
  {
    title: "CRM Integration",
    desc: "Seamless CRM integration that unifies your marketing, sales, and customer data.",
    icon: LayoutDashboard,
  },
  {
    title: "Landing Page Design",
    desc: "High-converting landing pages optimized for specific campaigns and lead generation.",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
          {services.map((service, idx) => {
            const Icon = service.icon;
            
            // New elegant animation variants
            const animationVariants = [
              { 
                initial: { opacity: 0, y: 30 }, 
                whileInView: { opacity: 1, y: 0 }, 
                transition: { duration: 0.4, delay: idx * 0.06 } 
              },
              { 
                initial: { opacity: 0, scale: 0.95 }, 
                whileInView: { opacity: 1, scale: 1 }, 
                transition: { duration: 0.4, delay: idx * 0.06 } 
              },
              { 
                initial: { opacity: 0, x: -20 }, 
                whileInView: { opacity: 1, x: 0 }, 
                transition: { duration: 0.4, delay: idx * 0.06 } 
              },
              { 
                initial: { opacity: 0, x: 20 }, 
                whileInView: { opacity: 1, x: 0 }, 
                transition: { duration: 0.4, delay: idx * 0.06 } 
              },
              { 
                initial: { opacity: 0, y: -20 }, 
                whileInView: { opacity: 1, y: 0 }, 
                transition: { duration: 0.4, delay: idx * 0.06 } 
              },
              { 
                initial: { opacity: 0, scale: 0.9, y: 20 }, 
                whileInView: { opacity: 1, scale: 1, y: 0 }, 
                transition: { duration: 0.4, delay: idx * 0.06 } 
              },
            ];
            
            const variant = animationVariants[idx % animationVariants.length];
            
            return (
              <motion.div
                key={idx}
                initial={variant.initial}
                whileInView={variant.whileInView}
                viewport={{ once: true, margin: "-100px" }}
                transition={variant.transition}
                className="group relative gradient-border p-5 md:p-6 lg:p-8 xl:p-10 rounded-2xl md:rounded-3xl transition-all duration-700 overflow-hidden hover:-translate-y-3 hover:shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)]"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 25px 80px -15px rgba(6,182,212,0.4)"
                }}
              >
                {/* Premium Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/10 via-royal-blue/10 to-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-electric-cyan via-royal-blue to-purple opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-700" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-18 rounded-2xl md:rounded-3xl bg-gradient-to-br from-electric-cyan/30 to-royal-blue/30 flex items-center justify-center mb-5 md:mb-7 lg:mb-9 border border-electric-cyan/40 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 shadow-[0_8px_32px_rgba(6,182,212,0.2)] group-hover:shadow-[0_12px_48px_rgba(6,182,212,0.4)]"
                    whileHover={{ scale: 1.25, rotate: 12 }}
                  >
                    <Icon className="text-electric-cyan group-hover:text-white transition-colors w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                  </motion.div>
                  
                  <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-heading font-bold text-white mb-3 md:mb-4 lg:mb-5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-electric-cyan group-hover:via-royal-blue group-hover:to-purple transition-colors duration-500">{service.title}</h4>
                  
                  <p className="text-sm md:text-base lg:text-lg text-gray-400 leading-relaxed mb-5 md:mb-7 lg:mb-9 flex-grow group-hover:text-gray-300 transition-colors duration-500">
                    {service.desc}
                  </p>
                  
                  <motion.div 
                    className="flex items-center gap-3 text-xs md:text-sm lg:text-base font-bold text-electric-cyan uppercase tracking-wider group-hover:gap-6 transition-all duration-500 mt-auto cursor-pointer group-hover:text-royal-blue"
                    whileHover={{ gap: 24 }}
                  >
                    <span>Learn More</span>
                    <span className="w-8 h-[2px] bg-gradient-to-r from-electric-cyan to-royal-blue group-hover:w-16 transition-all duration-500" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}