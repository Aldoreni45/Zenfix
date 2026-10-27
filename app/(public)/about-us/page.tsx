'use client';

import Link from 'next/link';
import { ArrowRight, Target, Users, Zap, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
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
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Zenfixin</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl leading-relaxed">
              We are a digital marketing and creative media agency helping businesses grow through data-driven strategies and innovative content solutions.
            </p>
            <Link
              href="/contact/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              Get In Touch
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-surface relative">
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
                Our Mission
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                To empower businesses with comprehensive digital marketing solutions that drive measurable growth and build lasting brand value. We combine creativity with data to deliver results that matter.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Founded in 2020, Zenfixin has helped numerous clients establish their digital presence, reach their target audiences, and achieve their business objectives through strategic marketing initiatives.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <Target className="text-electric-cyan w-8 h-8 mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Goal-Driven</h3>
                <p className="text-gray-400 text-sm">Every strategy is designed with clear, measurable objectives.</p>
              </div>
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <Users className="text-electric-cyan w-8 h-8 mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Client-Focused</h3>
                <p className="text-gray-400 text-sm">Your success is our priority. We work as partners.</p>
              </div>
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <Zap className="text-electric-cyan w-8 h-8 mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Innovative</h3>
                <p className="text-gray-400 text-sm">We stay ahead with the latest marketing trends and technologies.</p>
              </div>
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <Award className="text-electric-cyan w-8 h-8 mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Excellence</h3>
                <p className="text-gray-400 text-sm">Quality in everything we deliver, from strategy to execution.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
              What We Do
            </h2>
            <p className="text-gray-400 text-lg">
              We provide comprehensive digital marketing and creative services tailored to your business needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Digital Marketing',
                description: 'Strategic digital marketing campaigns that drive traffic, engagement, and conversions.',
              },
              {
                title: 'Social Media Management',
                description: 'Build and manage your social presence with engaging content and community growth.',
              },
              {
                title: 'SEO',
                description: 'Improve your search visibility and attract qualified organic traffic to your website.',
              },
              {
                title: 'Video Editing',
                description: 'Professional video editing services for marketing, social media, and brand content.',
              },
              {
                title: 'Content Creation',
                description: 'Compelling content that tells your story and resonates with your audience.',
              },
              {
                title: 'Brand Strategy',
                description: 'Develop a strong brand identity and positioning that sets you apart from competitors.',
              },
            ].map((service, idx) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-white/10 hover:border-electric-cyan/50 transition-colors"
              >
                <h3 className="text-white font-bold text-xl mb-3">{service.title}</h3>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTABanner />

      {/* Footer */}
      <Footer />
    </>
  );
}
