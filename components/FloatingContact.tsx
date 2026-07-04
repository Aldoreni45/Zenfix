"use client";

import { Phone, MessageCircle } from "lucide-react";

export default function FloatingContact() {
  return (
    <div className="fixed right-6 bottom-6 lg:right-10 lg:bottom-10 z-50 flex flex-col gap-4">
      {/* WhatsApp */}
      <a
        href="https://wa.me/15551234567"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="w-14 h-14 rounded-full glass border border-white/10 flex items-center justify-center text-electric-cyan shadow-[0_10px_40px_rgba(6,182,212,0.2)] hover:scale-110 hover:bg-electric-cyan hover:text-white hover:border-electric-cyan transition-all duration-300 relative group"
      >
        <MessageCircle size={24} />
        <span className="absolute right-full mr-4 px-4 py-2 glass border border-white/10 text-white text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-lg">
          Chat on WhatsApp
        </span>
      </a>

      {/* Phone */}
      <a
        href="tel:+15551234567"
        aria-label="Call"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center text-white shadow-[0_10px_40px_rgba(6,182,212,0.4)] hover:scale-110 transition-transform duration-300 relative group"
      >
        <Phone size={24} />
        <span className="absolute right-full mr-4 px-4 py-2 glass border border-white/10 text-white text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-lg">
          Call Us directly
        </span>
      </a>
    </div>
  );
}