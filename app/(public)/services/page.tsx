'use client';

import Link from 'next/link';
import { ArrowRight, Search, Megaphone, PenTool, LayoutDashboard, Code, Smartphone, Palette, BarChart3, Globe, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

const services = [
  {
    title: 'SEO Optimization',
    description: 'Improve your search visibility and drive qualified organic traffic to your website through proven SEO strategies.',
    icon: Search,
    details: [
      'Keyword research and strategy',
      'On-page and technical SEO',
      'Content optimization',
      'Link building',
      'Performance tracking and reporting',
    ],
  },
  {
    title: 'Google Ads & PPC',
    description: 'Target high-intent customers with performance-focused pay-per-click advertising campaigns.',
    icon: Target,
    details: [
      'Campaign setup and management',
      'Keyword bidding strategy',
      'Ad copy optimization',
      'Conversion tracking',
      'ROI optimization',
    ],
  },
  {
    title: 'Social Media Marketing',
    description: 'Build your brand presence and engage your audience with strategic social media campaigns.',
    icon: Megaphone,
    details: [
      'Platform-specific strategy',
      'Content creation and scheduling',
      'Community management',
      'Paid social advertising',
      'Analytics and insights',
    ],
  },
  {
    title: 'Content Marketing',
    description: 'Create valuable content that establishes authority and drives meaningful engagement.',
    icon: PenTool,
    details: [
      'Content strategy development',
      'Blog and article writing',
      'Video content creation',
      'Infographic design',
      'Content distribution',
    ],
  },
  {
    title: 'Website Development',
    description: 'Fast, responsive websites built for performance, user experience, and conversion.',
    icon: LayoutDashboard,
    details: [
      'Custom website design',
      'Responsive development',
      'Performance optimization',
      'CMS integration',
      'Maintenance and support',
    ],
  },
  {
    title: 'Brand Strategy',
    description: 'Develop a comprehensive brand identity that resonates with your target audience.',
    icon: Palette,
    details: [
      'Brand positioning',
      'Visual identity design',
      'Brand guidelines',
      'Messaging strategy',
      'Brand implementation',
    ],
  },
];

export default function ServicesPage() {
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
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl leading-relaxed">
              Comprehensive digital marketing solutions designed to accelerate your business growth and maximize your online presence.
            </p>
            <Link
              href="/contact/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              Start Your Project
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-24 lg:py-32 bg-surface relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-8 rounded-2xl border border-white/10 hover:border-electric-cyan/50 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 border border-electric-cyan/30 flex items-center justify-center mb-6">
                    <Icon className="text-electric-cyan w-6 h-6" />
                  </div>
                  
                  <h3 className="text-white font-bold text-2xl mb-4">{service.title}</h3>
                  
                  <p className="text-gray-400 leading-relaxed mb-6">{service.description}</p>
                  
                  <ul className="space-y-3">
                    {service.details.map((detail, i) => (
                      <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                        <span className="text-electric-cyan mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-16 text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
              Our Process
            </h2>
            <p className="text-gray-400 text-lg">
              We follow a proven methodology to deliver results for our clients.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery', description: 'We learn about your business, goals, and target audience.' },
              { step: '02', title: 'Strategy', description: 'We develop a customized marketing plan tailored to your needs.' },
              { step: '03', title: 'Execution', description: 'We implement the strategy with precision and creativity.' },
              { step: '04', title: 'Optimization', description: 'We continuously monitor and optimize for better results.' },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-royal-blue mb-4">
                  {item.step}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
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
