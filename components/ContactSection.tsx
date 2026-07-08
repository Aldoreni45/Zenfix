"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock3, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const contactItems = [
  { icon: MapPin, label: "Address", value: "Chentharai, P.O, Keezhkulam, Karungal, Tamil Nadu 629193" },
  { icon: Phone, label: "Call Us", value: "+91 83009 80023" },
  { icon: Mail, label: "Email Us", value: "zenfixin@gmail.com" },
  { icon: Clock3, label: "Working Hours", value: "Monday – Saturday · 9:00 AM – 5:00 PM" },
];

const services = [
  "Select a Service",
  "Search Engine Optimization (SEO)",
  "Google Ads / PPC",
  "Meta & Social Media Ads",
  "Content Marketing",
  "Branding & Web Design",
  "Marketing Automation",
];

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48 relative bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-electric-cyan/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-electric-cyan/30 bg-electric-cyan/5 text-electric-cyan mb-6"
          >
            <span className="text-xs font-bold tracking-widest uppercase">Get In Touch</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-tight mb-6"
          >
            Ready to Scale <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Your Business?</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 lg:gap-16 items-start">
          
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-10"
          >
            <div className="glass-card p-10 rounded-[32px] border border-white/10 shadow-xl">
              <h3 className="text-3xl font-heading font-bold text-white mb-10">Contact Information</h3>
              <div className="space-y-8">
                {contactItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 border border-electric-cyan/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={24} className="text-electric-cyan" />
                      </div>
                      <div className="pt-2">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-white font-medium text-lg">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="w-full h-56 glass-card rounded-[32px] border border-white/10 overflow-hidden relative group shadow-xl">
              <iframe
                src="https://maps.google.com/maps?q=Chentharai,Keezhkulam,Karungal,Tamil+Nadu+629193&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 glass px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-white">
                <MapPin size={16} className="text-electric-cyan" />
                <span className="text-xs font-bold tracking-wide">Chentharai, Tamil Nadu</span>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 glass-card p-10 md:p-12 xl:p-16 rounded-[40px] border border-white/10 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple/10 rounded-full blur-[100px] pointer-events-none" />
            
            <h3 className="text-3xl font-heading font-bold text-white mb-3">Book Your Strategy Call</h3>
            <p className="text-gray-400 text-base md:text-lg lg:text-xl mb-10">Fill out the form below and our growth experts will get back to you within 24 hours.</p>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Full Name</label>
                  <input type="text" required placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all shadow-sm" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Email Address</label>
                  <input type="email" required placeholder="john@company.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all shadow-sm" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Phone Number</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all shadow-sm" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Service Required</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all appearance-none cursor-pointer shadow-sm">
                    {services.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold tracking-widest uppercase text-gray-500">Project Details</label>
                <textarea required placeholder="Tell us about your business goals and marketing budget..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/10 transition-all resize-none h-40 shadow-sm" />
              </div>
              
              {status === "success" && (
                <div className="p-5 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/30 flex items-center gap-4 text-electric-cyan">
                  <CheckCircle2 size={24} />
                  <p className="text-base font-medium">Message sent successfully! We'll be in touch soon.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="w-full group relative inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-royal-blue to-purple text-white font-bold text-base md:text-lg rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100 shadow-xl min-h-[52px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan to-royal-blue opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {status === "loading" ? (
                  <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Submit Application</span>
                    <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}