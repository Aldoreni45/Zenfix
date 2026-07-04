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
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group relative gradient-border p-5 md:p-6 lg:p-8 xl:p-10 rounded-2xl md:rounded-3xl transition-all duration-500 overflow-hidden hover:-translate-y-2"
              >
                {/* Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/5 via-royal-blue/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <motion.div 
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 flex items-center justify-center mb-4 md:mb-6 lg:mb-8 border border-electric-cyan/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                    whileHover={{ scale: 1.1, rotate: 6 }}
                  >
                    <Icon className="text-electric-cyan group-hover:text-royal-blue transition-colors w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-8" />
                  </motion.div>
                  
                  <h4 className="text-base md:text-lg lg:text-xl xl:text-2xl font-heading font-bold text-white mb-2 md:mb-3 lg:mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-electric-cyan group-hover:to-royal-blue transition-colors">{service.title}</h4>
                  
                  <p className="text-xs md:text-sm lg:text-base text-gray-400 leading-relaxed mb-4 md:mb-6 lg:mb-8 flex-grow">
                    {service.desc}
                  </p>
                  
                  <motion.div 
                    className="flex items-center gap-2 text-[10px] md:text-xs lg:text-sm font-bold text-electric-cyan uppercase tracking-wider group-hover:gap-4 transition-all mt-auto cursor-pointer"
                    whileHover={{ gap: 16 }}
                  >
                    <span>Learn More</span>
                    <span className="w-6 h-[2px] bg-electric-cyan group-hover:w-10 transition-all" />
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