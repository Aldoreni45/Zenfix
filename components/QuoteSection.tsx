"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const brands: { name: string; logo: React.ReactNode }[] = [
  {
    name: "Google",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: "Microsoft",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </svg>
    ),
  },
  {
    name: "Apple",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#1d1d1f" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    name: "Netflix",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#E50914" d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.01-15.913.012-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
      </svg>
    ),
  },
  {
    name: "Spotify",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  },
  {
    name: "Stripe",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 12.153 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.03-7.305z"/>
      </svg>
    ),
  },
  {
    name: "Shopify",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#96BF48" d="M20.9 4.3c-.1-.1-.2-.1-.3-.1h-4l-.6-3.3c-.1-.3-.3-.5-.6-.5h-6.3c-.3 0-.5.2-.6.5l-.6 3.3h-4c-.1 0-.2 0-.3.1-.1.1-.1.2-.1.3l2.9 16.6c.1.3.3.5.6.5h10.4c.3 0 .5-.2.6-.5l2.9-16.6c0-.1 0-.2-.1-.3zm-9.6 11.5c-2.3 0 0-6.2 0-6.2s2.3 6.2 0 6.2zm-3.1-6.2c0 2.3-1.2 4.2-2.7 4.2s-2.7-1.9-2.7-4.2c0-2.3 1.2-4.2 2.7-4.2s2.7 1.9 2.7 4.2zm9.3 4.2c-1.5 0-2.7-1.9-2.7-4.2 0-2.3 1.2-4.2 2.7-4.2s2.7 1.9 2.7 4.2c0 2.3-1.2 4.2-2.7 4.2z"/>
      </svg>
    ),
  },
  {
    name: "Slack",
    logo: (
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#E01A4A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.528 2.528 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
    ),
  },
  {
    name: "Untitled-3",
    logo: (
      <Image
        src="/projects/untitled_3.png"
        alt="Untitled-3 Logo"
        width={120}
        height={60}
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    name: "Optimist",
    logo: (
      <Image
        src="/projects/optimist_finalized_logo_design.png"
        alt="Optimist Logo"
        width={120}
        height={60}
        className="w-full h-full object-contain"
      />
    ),
  },
];

export default function QuoteSection() {
  return (
    <section className="py-20 bg-surface border-y border-white/5 overflow-hidden relative">
      {/* Gradient accents */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-electric-cyan/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 xl:px-24 relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-sm font-bold tracking-widest text-gray-500 uppercase mb-12"
        >
          Trusted By Industry Leaders &amp; Ambitious Brands
        </motion.p>

        <div className="relative flex overflow-x-hidden">
          <div className="flex animate-marquee whitespace-nowrap gap-20 md:gap-32 items-center">
            {[...brands, ...brands, ...brands].map((brand, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 flex items-center justify-center hover:scale-105 transition-all duration-300"
              >
                {/* Uniform white card for every logo */}
                <div className="w-32 h-16 md:w-40 md:h-20 bg-white rounded-xl px-4 py-3 shadow-md flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300">
                  {brand.logo}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}