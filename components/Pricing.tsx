"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Growth",
    price: "$2,500",
    period: "/month",
    desc: "Perfect for scaling businesses looking to dominate local search and generate consistent leads.",
    features: [
      "Advanced SEO Optimization",
      "Google Ads Management (Up to $10k spend)",
      "Basic Meta Ads Campaign",
      "Monthly Performance Report",
      "Dedicated Account Manager",
      "Email Support"
    ],
    recommended: false,
  },
  {
    name: "Scale",
    price: "$5,000",
    period: "/month",
    desc: "Comprehensive multi-channel strategy for established brands aiming for exponential growth.",
    features: [
      "Everything in Growth, plus:",
      "Enterprise SEO Strategy",
      "Unlimited Google & Meta Ads Scaling",
      "Content Marketing (4 blogs/mo)",
      "Custom Data Dashboards",
      "Priority 24/7 Slack Support"
    ],
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Bespoke marketing architecture for large organizations with complex sales cycles.",
    features: [
      "Everything in Scale, plus:",
      "Full Funnel Automation",
      "AI-Driven Conversion Optimization",
      "Brand Identity & Positioning",
      "Weekly Strategy Workshops",
      "In-House Team Training"
    ],
    recommended: false,
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48 relative bg-background overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight mb-6"
          >
            Transparent Pricing. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Exceptional ROI.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg lg:text-xl text-gray-400"
          >
            No hidden fees. No long-term lock-ins. Just data-driven marketing systems built to scale your revenue.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 xl:gap-12 items-center max-w-7xl mx-auto lg:max-w-none 2xl:max-w-[1800px]">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className={`relative rounded-[40px] p-10 xl:p-12 ${
                plan.recommended 
                  ? "bg-gradient-to-b from-royal-blue/20 to-purple/20 border-2 border-electric-cyan shadow-[0_20px_60px_rgba(6,182,212,0.2)] lg:-translate-y-4" 
                  : "glass-card border border-white/10 shadow-lg"
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-electric-cyan to-royal-blue rounded-full text-xs font-bold text-white tracking-widest uppercase shadow-md">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-3xl font-bold text-white mb-4">{plan.name}</h3>
              <p className="text-base text-gray-400 mb-8 min-h-[48px]">{plan.desc}</p>
              
              <div className="flex items-baseline gap-2 mb-10 pb-10 border-b border-white/10">
                <span className="text-5xl md:text-6xl font-heading font-bold text-white">{plan.price}</span>
                <span className="text-gray-400 font-medium">{plan.period}</span>
              </div>
              
              <ul className="space-y-6 mb-12">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-4">
                    <div className={`mt-1 shrink-0 ${plan.recommended ? "text-electric-cyan" : "text-gray-500"}`}>
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <span className="text-gray-300 text-base font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="#contact"
                className={`block w-full py-4 md:py-5 text-center rounded-2xl font-bold text-base md:text-lg transition-all hover:scale-105 active:scale-95 min-h-[52px] ${
                  plan.recommended
                    ? "bg-gradient-to-r from-electric-cyan to-royal-blue text-white shadow-[0_10px_30px_rgba(6,182,212,0.3)] active:scale-95"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
