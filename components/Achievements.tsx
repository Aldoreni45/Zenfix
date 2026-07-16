"use client";

import { Rocket, Users, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Achievements() {
  const [counters, setCounters] = useState({ projects: 0, clients: 0, satisfaction: 0, experts: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('achievements');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = { projects: 1200, clients: 600, satisfaction: 98, experts: 25 };
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCounters({
        projects: Math.floor(targets.projects * easeOut),
        clients: Math.floor(targets.clients * easeOut),
        satisfaction: Math.floor(targets.satisfaction * easeOut),
        experts: Math.floor(targets.experts * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  const stats = [
    { value: `${counters.projects}+`, label: "Projects Delivered", icon: Rocket },
    { value: `${counters.clients}+`, label: "Happy Clients", icon: Users },
    { value: `${counters.satisfaction}%`, label: "Client Satisfaction", icon: TrendingUp },
    { value: `${counters.experts}+`, label: "Marketing Experts", icon: Zap },
  ];

  return (
    <section id="achievements" className="relative py-[40px] md:py-[60px] bg-background overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-electric-cyan/5 rounded-full mix-blend-screen filter blur-[150px] animate-aurora-1" />
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-royal-blue/5 rounded-full mix-blend-screen filter blur-[150px] animate-aurora-2" />
      </div>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-[24px] md:px-[50px] lg:px-[100px]">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-heading font-bold text-white leading-[1.1] mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple bg-[length:200%_auto] animate-gradient-shine">Achievements</span>
          </h2>
          <p className="text-[clamp(1rem,1.3vw,1.3rem)] text-gray-400 max-w-[620px] mx-auto leading-[1.9]">
            Trusted by industry leaders and ambitious brands worldwide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 justify-items-center">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="w-full max-w-[320px] h-[180px] px-6 py-8 glass-card rounded-[24px] flex flex-col items-center justify-center gap-4 hover:scale-105 hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all duration-500 group relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/5 via-royal-blue/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Icon */}
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              
              {/* Counter */}
              <p className="relative z-10 text-[clamp(2.5rem,4vw,3.5rem)] font-heading font-bold text-white leading-tight group-hover:text-electric-cyan transition-colors duration-300">
                {stat.value}
              </p>
              
              {/* Label */}
              <p className="relative z-10 text-sm text-gray-400 text-center font-medium group-hover:text-white transition-colors duration-300">
                {stat.label}
              </p>

              {/* Line Animation */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-electric-cyan via-royal-blue to-purple transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
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
          50% { transform: translate(30px, -20px) scale(1.1); opacity: 0.08; }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          50% { transform: translate(-30px, 20px) scale(1.1); opacity: 0.08; }
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
      `}</style>
    </section>
  );
}
