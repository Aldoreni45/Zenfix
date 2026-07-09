"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Preloader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const hideTimer = setTimeout(() => setLoading(false), 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{
          background: "#050816",
          transition: "opacity 0.5s ease",
          opacity: fadeOut ? 0 : 1,
        }}
      >
        <div className="text-center">
          {/* Logo */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center shadow-lg shadow-electric-cyan/30 animate-pulse-glow overflow-hidden">
              <Image src="/z_logo.png" alt="ZenFix Logo" width={80} height={80} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Brand Name */}
          <h1
            className="font-heading font-bold text-5xl md:text-7xl text-white tracking-wider uppercase mb-6 animate-fadeIn"
          >
            ZenFix
          </h1>

          {/* Loading Bar */}
          <div className="w-48 h-1 mx-auto bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-electric-cyan to-royal-blue rounded-full animate-loading"
              style={{
                animation: "loading 1.5s ease-in-out infinite",
              }}
            />
          </div>

          {/* Subtitle */}
          <p
            className="mt-6 text-sm font-bold tracking-widest text-gray-500 uppercase animate-fadeIn"
            style={{ animationDelay: "0.3s" }}
          >
            Digital Marketing Agency
          </p>
        </div>

        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
            50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.6); }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}