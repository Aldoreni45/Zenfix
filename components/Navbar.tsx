"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { id: "home",         label: "Home" },
  { id: "services",     label: "Services" },
  { id: "process",      label: "Process" },
  { id: "portfolio",    label: "Portfolio" },
  { id: "pricing",      label: "Pricing" },
  { id: "faq",          label: "FAQ" },
];

export default function Navbar() {
  const [active, setActive]     = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const scrollPos = window.scrollY + 100;
      navItems.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActive(id);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <div className={`flex items-center justify-between rounded-full transition-all duration-500 ${
            scrolled ? "glass px-6 py-3 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" : "bg-transparent px-2 py-2"
          }`}>
            
            {/* LOGO */}
            <Link href="#home" onClick={closeMenu} className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-cyan via-royal-blue to-purple flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] overflow-hidden">
                <Image src="/z-logo.png" alt="ZenFix Logo" width={40} height={40} className="w-full h-full object-contain" />
              </div>
              <span className="font-heading font-bold text-2xl tracking-wide text-white uppercase">
                ZenFix
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex items-center gap-10">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className={`text-sm font-medium tracking-wide uppercase transition-colors relative group py-2 ${
                    active === item.id ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active === item.id && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-electric-cyan via-royal-blue to-purple rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    />
                  )}
                </Link>
              ))}
            </nav>
            
            <div className="hidden lg:flex items-center gap-4">
              <Link 
                href="#contact" 
                className="relative inline-flex items-center justify-center px-5 md:px-6 py-2.5 md:py-3 text-sm font-medium text-white transition-all duration-300 bg-gradient-to-r from-royal-blue to-purple rounded-full hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden group min-h-[44px]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-electric-cyan to-royal-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>

            {/* HAMBURGER */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
              className="lg:hidden relative z-50 p-2 text-gray-400 hover:text-white transition-colors"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-navy/95 backdrop-blur-xl flex flex-col justify-center items-center"
          >
            <nav className="flex flex-col items-center gap-8">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link
                    href={`#${item.id}`}
                    onClick={closeMenu}
                    className={`text-xl md:text-2xl font-heading font-medium uppercase tracking-widest transition-all py-2 ${
                      active === item.id ? "text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.1, duration: 0.4 }}
                className="mt-8"
              >
                <Link 
                  href="#contact" 
                  onClick={closeMenu} 
                  className="px-6 md:px-8 py-3 md:py-4 rounded-full bg-gradient-to-r from-electric-cyan via-royal-blue to-purple text-white font-medium tracking-wide uppercase hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-95 transition-all flex items-center gap-2 min-h-[48px]"
                >
                  Book Strategy Call
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}