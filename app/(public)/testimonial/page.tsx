'use client';

import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function TestimonialPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-48 lg:pb-32 relative overflow-hidden bg-background">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-cyan/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6">
              Client <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Testimonials</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl leading-relaxed">
              Hear from businesses that have partnered with Zenfixin to achieve their digital marketing goals.
            </p>
            <Link
              href="/contact/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              Become Our Client
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-surface relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
              What Our Clients Say
            </h2>
            <p className="text-gray-400 text-lg">
              We value our client relationships and take pride in delivering results that exceed expectations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Digital Marketing Excellence',
                role: 'Marketing Strategy',
                content: 'Zenfixin transformed our digital presence with a comprehensive marketing strategy. Their data-driven approach helped us reach our target audience effectively.',
              },
              {
                name: 'Social Media Growth',
                role: 'Social Media Management',
                content: 'The team at Zenfixin managed our social media channels professionally. We saw significant growth in engagement and brand awareness.',
              },
              {
                name: 'Creative Content',
                role: 'Content Creation',
                content: 'Creative and professional content that resonated with our audience. Zenfixin understood our brand voice and delivered consistently.',
              },
              {
                name: 'SEO Results',
                role: 'Search Engine Optimization',
                content: 'Our search rankings improved significantly after working with Zenfixin. Their SEO expertise is evident in the results we achieved.',
              },
              {
                name: 'Brand Development',
                role: 'Brand Strategy',
                content: 'Zenfixin helped us develop a strong brand identity. Their strategic approach to branding set us apart in our market.',
              },
              {
                name: 'Professional Partnership',
                role: 'Digital Marketing',
                content: 'Working with Zenfixin has been a great experience. Professional, responsive, and committed to delivering quality results.',
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-white/10 hover:border-electric-cyan/50 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-electric-cyan fill-electric-cyan" />
                  ))}
                </div>
                
                <p className="text-gray-300 leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <h3 className="text-white font-bold text-lg">{testimonial.name}</h3>
                  <p className="text-electric-cyan text-sm font-medium">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 md:p-16 rounded-3xl border border-white/10 text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
              Ready to Work With Us?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Let's discuss how we can help you achieve your digital marketing goals with a customized strategy.
            </p>
            <Link
              href="/contact/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner />

      {/* Footer */}
      <Footer />
    </>
  );
}
