"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BarChart3, TrendingUp, Users, Target, Zap, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroSlider() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const stats = [
    { value: "1200+", label: "Projects Delivered", icon: Target },
    { value: "600+", label: "Happy Clients", icon: Users },
    { value: "98%", label: "Client Satisfaction", icon: TrendingUp },
    { value: "25+", label: "Marketing Experts", icon: Zap },
  ];

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-start justify-start md:items-center md:justify-center overflow-hidden pt-20 sm:pt-24 md:pt-28 lg:pt-36 bg-background">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-electric-cyan/20 rounded-full mix-blend-screen filter blur-[150px] animate-aurora" />
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-royal-blue/20 rounded-full mix-blend-screen filter blur-[150px] animate-aurora" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple/10 rounded-full mix-blend-screen filter blur-[200px] animate-aurora" style={{ animationDelay: "5s" }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Mouse glow effect */}
        <motion.div
          className="fixed w-[400px] h-[400px] bg-electric-cyan/5 rounded-full pointer-events-none blur-[100px]"
          style={{
            x: mousePosition.x - 200,
            y: mousePosition.y - 200,
          }}
        />
      </div>

      <motion.div style={{ opacity }} className="relative z-10 w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-24 items-center w-full md:min-h-[calc(100vh-80px)]">
          {/* Left Content */}
          <div className="flex flex-col items-start gap-6 md:gap-8 lg:gap-10 w-full">


            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-heading font-bold text-white leading-[1.05] tracking-tight"
            >
              Helping Businesses <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Dominate</span> the Digital World
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 max-w-2xl lg:max-w-3xl leading-relaxed"
            >
              ZenFix delivers high-impact digital marketing, SEO, web development, mobile apps, branding, lead generation, and AI-powered automation that drives measurable business growth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto"
            >
              <Link
                href="#contact"
                className="group relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-semibold rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(37,99,235,0.3)] text-sm md:text-base min-h-[48px]"
              >
                <span className="relative z-10">Get Free Consultation</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan to-royal-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 md:px-8 py-3 md:py-4 glass border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-sm md:text-base min-h-[48px]"
              >
                Explore Our Services
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mt-6 md:mt-8 w-full"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="glass-card rounded-2xl p-3 md:p-4 lg:p-5 text-center"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-electric-cyan" />
                  <p className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div style={{ y: y1 }} className="relative h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] 2xl:h-[800px] hidden md:block w-full">
            {/* Main Dashboard Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-0 right-0 w-[85%] md:w-[90%] max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] 2xl:max-w-[800px] glass-card rounded-3xl p-5 md:p-6 lg:p-8 z-20 shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">Marketing Dashboard</h3>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-32 md:h-40 lg:h-48 w-full flex items-end gap-2 md:gap-3 mb-4 md:mb-6">
                {[35, 55, 45, 75, 60, 90, 80, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-royal-blue to-electric-cyan rounded-t-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: "Impressions", value: "2.4M", change: "+12%" },
                  { label: "Clicks", value: "89K", change: "+8%" },
                  { label: "Conversions", value: "3.2K", change: "+15%" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="bg-white/5 rounded-xl p-2 md:p-3"
                  >
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-base md:text-lg font-bold text-white">{item.value}</p>
                    <p className="text-[10px] md:text-xs text-electric-cyan">{item.change}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* SEO Card */}
            <motion.div
              style={{ y: y2 }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-[35%] md:top-[40%] lg:top-[45%] -left-4 md:-left-8 lg:-left-12 xl:-left-16 w-[75%] md:w-[80%] max-w-[280px] md:max-w-[340px] lg:max-w-[380px] glass-card rounded-3xl p-3 md:p-4 lg:p-6 z-30 shadow-2xl border border-white/10"
            >
              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center">
                  <Globe className="text-white w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">SEO Ranking</p>
                  <p className="text-2xl md:text-3xl font-heading font-bold text-white">#1</p>
                </div>
              </div>
              <div className="space-y-3">
                {["Google", "Bing", "Yahoo"].map((engine, i) => (
                  <div key={engine} className="flex items-center gap-3">
                    <span className="text-[10px] md:text-xs text-gray-400 w-12 md:w-16">{engine}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: i === 0 ? "95%" : i === 1 ? "88%" : "82%" }}
                        transition={{ duration: 1, delay: 1 + i * 0.1 }}
                        className="bg-gradient-to-r from-electric-cyan to-royal-blue h-2 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Lead Generation Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute -bottom-4 md:-bottom-8 right-4 md:right-8 lg:right-12 xl:right-20 w-[65%] md:w-[70%] max-w-[220px] md:max-w-[260px] lg:max-w-[300px] glass-card rounded-3xl p-3 md:p-4 lg:p-6 z-10 shadow-2xl border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple to-pink flex items-center justify-center">
                  <Target className="text-white w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-heading font-bold text-white">25K+</p>
                  <p className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider">New Leads</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="bg-gradient-to-r from-purple to-pink h-2 rounded-full"
                  />
                </div>
                <span className="text-[10px] md:text-xs text-gray-400">78%</span>
              </div>
            </motion.div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[8%] md:top-[10%] lg:top-[15%] right-[20%] md:right-[25%] lg:right-[30%] glass-card rounded-2xl px-2 py-1.5 md:px-3 md:py-2 z-40 border border-electric-cyan/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse" />
                <span className="text-[9px] md:text-[10px] lg:text-xs font-semibold text-white">Live Campaign Active</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-400 uppercase tracking-widest">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="text-electric-cyan" size={24} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}