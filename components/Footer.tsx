import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface pt-32 pb-12 border-t border-white/10 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 mb-16 md:mb-20 lg:mb-24">
          
          <div className="lg:col-span-4 md:pr-6 lg:pr-8">
            <Link href="#home" className="inline-flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-cyan to-royal-blue flex items-center justify-center shadow-lg shadow-electric-cyan/20 overflow-hidden">
                <Image src="/z_logo.png" alt="ZenFix Logo" width={40} height={40} className="w-full h-full object-contain" />
              </div>
              <span className="font-heading font-bold text-2xl tracking-wide text-white uppercase">
                ZenFix
              </span>
            </Link>
            <p className="text-gray-400 mb-10 max-w-md text-lg leading-relaxed">
              The premier digital marketing agency for ambitious brands looking to dominate their market through data-driven strategies and AI-powered execution. Founded in 2020.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-gray-400">
                <Mail size={20} className="text-electric-cyan" />
                <span className="text-sm">zenfixin@gmail.com</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <Phone size={20} className="text-electric-cyan" />
                <span className="text-sm">+91 83009 80023</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <MapPin size={20} className="text-electric-cyan" />
                <span className="text-sm">Chentharai, Tamil Nadu 629193</span>
              </div>
            </div>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-electric-cyan hover:border-electric-cyan hover:scale-110 transition-all duration-300"><Twitter size={20} /></a>
              <a href="#" className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-electric-cyan hover:border-electric-cyan hover:scale-110 transition-all duration-300"><Linkedin size={20} /></a>
              <a href="#" className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-electric-cyan hover:border-electric-cyan hover:scale-110 transition-all duration-300"><Instagram size={20} /></a>
              <a href="#" className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-electric-cyan hover:border-electric-cyan hover:scale-110 transition-all duration-300"><Facebook size={20} /></a>
            </div>
          </div>
          
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Company</h4>
              <ul className="space-y-5">
                <li><Link href="#about" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">About Us</Link></li>
                <li><Link href="#process" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Our Process</Link></li>
                <li><Link href="#portfolio" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Case Studies</Link></li>
                <li><Link href="#contact" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Services</h4>
              <ul className="space-y-5">
                <li><Link href="#services" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">SEO Mastery</Link></li>
                <li><Link href="#services" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Google Ads</Link></li>
                <li><Link href="#services" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Social Media</Link></li>
                <li><Link href="#services" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Content Marketing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Resources</h4>
              <ul className="space-y-5">
                <li><Link href="#blog" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Resources</Link></li>
                <li><Link href="#" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Case Studies</Link></li>
                <li><Link href="#" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Legal</h4>
              <ul className="space-y-5">
                <li><Link href="#" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-gray-400 font-medium hover:text-electric-cyan transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
        </div>
        
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm font-semibold tracking-wide">
            &copy; {new Date().getFullYear()} ZenFix Digital Agency. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-bold tracking-wide">
            <span className="text-gray-500">Designed with precision</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
