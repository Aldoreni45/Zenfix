"use client";

import { ArrowRight, TrendingUp, Zap, Target, BarChart3, Globe, Users, Sparkles, Search, Megaphone, Code } from "lucide-react";
import Link from "next/link";

export default function HeroSlider() {
  return (
    <section id="home" className="relative min-h-[90vh] lg:min-h-screen pt-[80px] pb-[60px] md:pt-[100px] md:pb-[80px] lg:pt-[120px] lg:pb-[100px] bg-background overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-30" />
        
        {/* Subtle Aurora Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-cyan/5 rounded-full mix-blend-screen filter blur-[300px] animate-aurora-1" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-royal-blue/5 rounded-full mix-blend-screen filter blur-[300px] animate-aurora-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple/3 rounded-full mix-blend-screen filter blur-[350px] animate-aurora-3" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-[20px] md:px-[40px] lg:px-[60px] xl:px-[80px]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-8 md:gap-12 lg:gap-20 items-center min-h-[auto] lg:min-h-[70vh]">
          {/* Left Content */}
          <div className="flex flex-col items-start gap-6 md:gap-8 lg:gap-12 order-1 lg:order-1">
            {/* Eyebrow */}
            <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-electric-cyan uppercase">
              Digital Growth Partner
            </p>

            {/* Headline */}
            <h1 className="text-[clamp(1.75rem,6vw,2.5rem)] md:text-[clamp(2rem,5vw,3rem)] lg:text-[clamp(2.5rem,4vw,3.5rem)] xl:text-[clamp(3rem,3.5vw,4rem)] font-heading font-bold text-white leading-[1.15] tracking-tight max-w-full">
              Helping Businesses
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple bg-[length:200%_auto] animate-gradient-shine">
                Grow Faster.
              </span>
              <span className="block text-gray-300">
                Rank Higher.
              </span>
              <span className="block text-gray-300">
                Convert Better.
              </span>
            </h1>

            {/* Description */}
            <p className="text-[clamp(0.85rem,1.3vw,0.95rem)] md:text-[clamp(0.9rem,1.1vw,1rem)] lg:text-[clamp(0.95rem,1vw,1.05rem)] text-gray-400 max-w-[600px] leading-[1.6]">
              ZenFix combines digital marketing, technology, and AI-powered solutions to help businesses attract more customers, build stronger brands, and grow faster.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto pt-2">
              <Link
                href="#contact"
                className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 h-[48px] sm:h-[52px] bg-gradient-to-r from-royal-blue to-purple text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] text-sm sm:text-base"
              >
                <span className="relative z-10">Get Free Consultation</span>
                <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform sm:size-16" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 h-[48px] sm:h-[52px] glass border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
              >
                Explore Our Services
              </Link>
            </div>
          </div>

          {/* Right Content - Growth Visualization */}
          <div className="relative w-full min-w-0 order-2 lg:order-2 flex items-center justify-center py-8 lg:py-0">
            {/* Central Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/10 via-royal-blue/5 to-purple/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse-slow" />
            
            {/* Central Hub */}
            <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px] lg:w-[360px] lg:h-[360px] xl:w-[400px] xl:h-[400px] flex items-center justify-center">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border border-electric-cyan/20 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full border border-royal-blue/20 animate-spin-slow-reverse" />
              
              {/* Center Circle */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-electric-cyan/20 via-royal-blue/20 to-purple/20 border border-white/10 backdrop-blur-sm flex items-center justify-center animate-float-gentle">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-white">+247%</p>
                  <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 uppercase tracking-wider mt-1">Growth</p>
                </div>
              </div>

              {/* Floating Metrics */}
              {/* Top - SEO */}
              <div className="absolute -top-2 md:-top-4 left-1/2 -translate-x-1/2 glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 border border-white/10 animate-float-1">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Search className="w-3 h-3 md:w-4 md:h-4 text-electric-cyan" />
                  <div>
                    <p className="text-sm md:text-lg font-bold text-white">#1</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">SEO</p>
                  </div>
                </div>
              </div>

              {/* Top Right - Leads */}
              <div className="absolute top-1/4 -right-1.5 md:-right-2 lg:-right-4 glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 border border-white/10 animate-float-2">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Target className="w-3 h-3 md:w-4 md:h-4 text-purple" />
                  <div>
                    <p className="text-sm md:text-lg font-bold text-white">25K+</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Leads</p>
                  </div>
                </div>
              </div>

              {/* Bottom Right - AI */}
              <div className="absolute bottom-1/4 -right-1.5 md:-right-2 lg:-right-4 glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 border border-white/10 animate-float-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-royal-blue" />
                  <div>
                    <p className="text-sm md:text-lg font-bold text-white">98%</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">AI</p>
                  </div>
                </div>
              </div>

              {/* Bottom - Social */}
              <div className="absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 border border-white/10 animate-float-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Users className="w-3 h-3 md:w-4 md:h-4 text-orange-400" />
                  <div>
                    <p className="text-sm md:text-lg font-bold text-white">1.2M</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Social</p>
                  </div>
                </div>
              </div>

              {/* Bottom Left - ROI */}
              <div className="absolute bottom-1/4 -left-1.5 md:-left-2 lg:-left-4 glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 border border-white/10 animate-float-5">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  <div>
                    <p className="text-sm md:text-lg font-bold text-white">5.2x</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">ROI</p>
                  </div>
                </div>
              </div>

              {/* Top Left - Ads */}
              <div className="absolute top-1/4 -left-1.5 md:-left-2 lg:-left-4 glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 border border-white/10 animate-float-6">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Megaphone className="w-3 h-3 md:w-4 md:h-4 text-pink-400" />
                  <div>
                    <p className="text-sm md:text-lg font-bold text-white">Ads</p>
                    <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">PPC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient-shine {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes aurora-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          50% { transform: translate(30px, -20px) scale(1.05); opacity: 0.08; }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          50% { transform: translate(-30px, 20px) scale(1.05); opacity: 0.08; }
        }
        @keyframes aurora-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.03; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.05; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes float-5 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-6 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.7; }
        }
        .animate-gradient-shine {
          animation: gradient-shine 8s ease-in-out infinite;
        }
        .animate-aurora-1 {
          animation: aurora-1 25s ease-in-out infinite;
        }
        .animate-aurora-2 {
          animation: aurora-2 30s ease-in-out infinite;
        }
        .animate-aurora-3 {
          animation: aurora-3 35s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
        .animate-float-gentle {
          animation: float-gentle 6s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: float-1 4s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 5s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-3 4.5s ease-in-out infinite;
        }
        .animate-float-4 {
          animation: float-4 5.5s ease-in-out infinite;
        }
        .animate-float-5 {
          animation: float-5 4.8s ease-in-out infinite;
        }
        .animate-float-6 {
          animation: float-6 5.2s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}