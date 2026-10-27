import Link from 'next/link';
import { Home, ArrowRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple mb-6">
              404
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
              Page Not Found
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl mb-12 leading-relaxed">
              Looks like this page took a different route. The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
              >
                <Home size={20} />
                Back to Home
              </Link>
              
              <Link
                href="/services/"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-colors"
              >
                <Search size={20} />
                Browse Services
              </Link>
            </div>
          </motion.div>
          
          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 max-w-md mx-auto"
          >
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest mb-6">
              Quick Links
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/about-us/"
                className="text-gray-400 hover:text-electric-cyan transition-colors text-left py-2 border-b border-white/10 hover:border-electric-cyan/30"
              >
                About Us
              </Link>
              <Link
                href="/services/"
                className="text-gray-400 hover:text-electric-cyan transition-colors text-left py-2 border-b border-white/10 hover:border-electric-cyan/30"
              >
                Services
              </Link>
              <Link
                href="/works/"
                className="text-gray-400 hover:text-electric-cyan transition-colors text-left py-2 border-b border-white/10 hover:border-electric-cyan/30"
              >
                Portfolio
              </Link>
              <Link
                href="/contact/"
                className="text-gray-400 hover:text-electric-cyan transition-colors text-left py-2 border-b border-white/10 hover:border-electric-cyan/30"
              >
                Contact
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
