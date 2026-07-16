"use client";

import { ArrowRight, TrendingUp, Zap, Target, BarChart3, Globe, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HeroSlider() {
  return (
    <section id="home" className="relative min-h-screen pt-[80px] pb-[40px] md:pt-[100px] md:pb-[60px] lg:pt-[120px] lg:pb-[60px] bg-background overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />
        
        {/* Aurora Background */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-electric-cyan/10 rounded-full mix-blend-screen filter blur-[200px] animate-aurora-1" />
        <div className="absolute bottom-0 right-1/4 w-[900px] h-[900px] bg-royal-blue/10 rounded-full mix-blend-screen filter blur-[200px] animate-aurora-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple/5 rounded-full mix-blend-screen filter blur-[250px] animate-aurora-3" />
        
        {/* Moving Gradient Lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-electric-cyan to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-royal-blue to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple to-transparent" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-[20px] md:px-[40px] lg:px-[80px] xl:px-[100px]">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 md:gap-16 lg:gap-[100px] items-start">
          {/* Left Content */}
          <div className="flex flex-col items-start gap-10 md:gap-12 lg:gap-16">

            <h1 className="text-[clamp(2.2rem,7vw,3rem)] md:text-[clamp(2.8rem,5vw,4rem)] lg:text-[clamp(3.5rem,5.5vw,5.5rem)] xl:text-[clamp(4rem,6vw,6rem)] font-heading font-bold text-white leading-[1.15] tracking-tight max-w-full">
              <span className="block mb-2">Helping Businesses</span>{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple bg-[length:200%_auto] animate-gradient-shine mb-2">
                Dominate
              </span>{" "}
              <span className="block">the Digital World</span>
            </h1>

            <p className="text-[clamp(0.95rem,1.2vw,1.15rem)] md:text-[clamp(1rem,1.3vw,1.2rem)] lg:text-[clamp(1.05rem,1.3vw,1.25rem)] text-gray-400 max-w-full leading-[1.9]">
              ZenFix delivers high-impact digital marketing, SEO, web development, mobile apps, branding, lead generation, and AI-powered automation that drives measurable business growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mt-4">
              <Link
                href="#contact"
                className="group relative inline-flex items-center justify-center gap-2 px-8 h-[58px] bg-gradient-to-r from-royal-blue to-purple text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.3)]"
              >
                <span className="relative z-10">Get Free Consultation</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform animate-arrow-bounce" />
                <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan to-royal-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-border-glow" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-8 h-[58px] glass border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                Explore Our Services
              </Link>
            </div>
          </div>

          {/* Right Content - AI Powered Dashboard */}
          <div className="relative lg:mt-8">
            <div className="grid grid-cols-2 gap-4 md:gap-5 lg:gap-6 max-w-full">
              {/* Marketing Card - Top Center */}
              <div className="col-span-2 glass-card rounded-3xl p-6 border border-white/10 animate-float-1 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Marketing Analytics</p>
                    <p className="text-2xl font-heading font-bold text-white">+247%</p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-electric-cyan to-royal-blue rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              {/* Lead Card - Left */}
              <div className="glass-card rounded-3xl p-5 border border-white/10 animate-float-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-pink flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Lead Gen</p>
                    <p className="text-xl font-heading font-bold text-white">25K+</p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple to-pink rounded-full" style={{ width: "78%" }} />
                </div>
              </div>

              {/* SEO Card - Right */}
              <div className="glass-card rounded-3xl p-5 border border-white/10 animate-float-3 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">SEO Growth</p>
                    <p className="text-xl font-heading font-bold text-white">#1</p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-electric-cyan to-royal-blue rounded-full" style={{ width: "95%" }} />
                </div>
              </div>

              {/* AI Card - Center */}
              <div className="col-span-2 glass-card rounded-3xl p-6 border border-white/10 animate-float-4 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-cyan via-royal-blue to-purple flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">AI Automation</p>
                    <p className="text-2xl font-heading font-bold text-white">98% Efficient</p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-electric-cyan via-royal-blue to-purple rounded-full" style={{ width: "98%" }} />
                </div>
              </div>

              {/* ROI Card - Left */}
              <div className="glass-card rounded-3xl p-5 border border-white/10 animate-float-5 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">ROI</p>
                    <p className="text-xl font-heading font-bold text-white">5.2x</p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>

              {/* Social Card - Right */}
              <div className="glass-card rounded-3xl p-5 border border-white/10 animate-float-6 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Social</p>
                    <p className="text-xl font-heading font-bold text-white">1.2M</p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full" style={{ width: "88%" }} />
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
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
          50% { transform: translate(50px, -30px) scale(1.1); opacity: 0.15; }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
          50% { transform: translate(-50px, 30px) scale(1.1); opacity: 0.15; }
        }
        @keyframes aurora-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.05; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.08; }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-5 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-6 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes arrow-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        @keyframes border-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(6,182,212,0); }
        }
        .animate-gradient-shine {
          animation: gradient-shine 8s ease-in-out infinite;
        }
        .animate-aurora-1 {
          animation: aurora-1 20s ease-in-out infinite;
        }
        .animate-aurora-2 {
          animation: aurora-2 25s ease-in-out infinite;
        }
        .animate-aurora-3 {
          animation: aurora-3 30s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 5s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
        }
        .animate-float-4 {
          animation: float-4 5.5s ease-in-out infinite;
        }
        .animate-float-5 {
          animation: float-5 6.5s ease-in-out infinite;
        }
        .animate-float-6 {
          animation: float-6 5.8s ease-in-out infinite;
        }
        .animate-bar-fill {
          animation: bar-fill 1.5s ease-out forwards;
        }
        .animate-bar-fill-delayed {
          animation: bar-fill-delayed 1.5s ease-out 0.2s forwards;
        }
        .animate-bar-fill-delayed-2 {
          animation: bar-fill-delayed-2 1.5s ease-out 0.4s forwards;
        }
        .animate-bar-fill-delayed-3 {
          animation: bar-fill-delayed-3 1.5s ease-out 0.6s forwards;
        }
        .animate-bar-fill-delayed-4 {
          animation: bar-fill-delayed-4 1.5s ease-out 0.8s forwards;
        }
        .animate-bar-fill-delayed-5 {
          animation: bar-fill-delayed-5 1.5s ease-out 1s forwards;
        }
        .animate-arrow-bounce {
          animation: arrow-bounce 2s ease-in-out infinite;
        }
        .animate-border-glow {
          animation: border-glow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}