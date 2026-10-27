'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function WorksPage() {
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
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-royal-blue to-purple">Work</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl leading-relaxed">
              Explore our portfolio of digital marketing projects and creative campaigns that have helped businesses achieve their goals.
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

      {/* Portfolio Grid */}
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
              Selected Projects
            </h2>
            <p className="text-gray-400 text-lg">
              We work with businesses across various industries to deliver impactful digital marketing solutions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Digital Marketing Campaign',
                category: 'Digital Marketing',
                description: 'Comprehensive digital marketing strategy including SEO, social media, and content marketing.',
                image: '/projects/portfolio_page_1.jpeg',
              },
              {
                title: 'Social Media Growth',
                category: 'Social Media',
                description: 'Strategic social media management that increased engagement and brand awareness.',
                image: '/projects/portfolio_page_2.jpeg',
              },
              {
                title: 'Brand Identity Design',
                category: 'Branding',
                description: 'Complete brand identity development including logo, visual assets, and brand guidelines.',
                image: '/projects/portfolio_page_3.jpeg',
              },
              {
                title: 'Website Development',
                category: 'Web Development',
                description: 'Custom website design and development with focus on performance and user experience.',
                image: '/projects/portfolio_page_4.jpeg',
              },
              {
                title: 'Content Marketing Strategy',
                category: 'Content',
                description: 'Content strategy and creation that established thought leadership and drove organic traffic.',
                image: '/projects/portfolio_page_5.jpeg',
              },
              {
                title: 'Video Production',
                category: 'Video',
                description: 'Professional video production and editing for marketing campaigns and social media.',
                image: '/projects/portfolio_page_6.jpeg',
              },
            ].map((project, idx) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group glass-card rounded-2xl border border-white/10 overflow-hidden hover:border-electric-cyan/50 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="aspect-video bg-gradient-to-br from-electric-cyan/20 to-royal-blue/20 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    Project Image
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-3">
                    <span className="px-3 py-1 bg-electric-cyan/20 text-electric-cyan text-xs font-bold uppercase tracking-wider rounded-full border border-electric-cyan/30">
                      {project.category}
                    </span>
                  </div>
                  
                  <h3 className="text-white font-bold text-xl mb-3 group-hover:text-electric-cyan transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>
                  
                  <Link
                    href="/contact/"
                    className="inline-flex items-center gap-2 text-electric-cyan font-medium text-sm hover:text-white transition-colors"
                  >
                    Learn More
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services CTA */}
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
              Ready to Start Your Project?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Let's discuss how we can help you achieve your digital marketing goals with a customized strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact/"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-royal-blue to-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
              >
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/services/"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-colors"
              >
                View Services
                <ExternalLink size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <CTABanner />

      {/* Footer */}
      <Footer />
    </>
  );
}
