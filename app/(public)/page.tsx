import HeroSlider from "@/components/HeroSlider";
import WhyChooseUs from "@/components/WhyChooseUs";
import ServicesSection from "@/components/ServicesSection";
import MarketingProcess from "@/components/MarketingProcess";
import WorkProcess from "@/components/WorkProcess";
import QuoteSection from "@/components/QuoteSection"; // Trusted By Marquee
import dynamic from "next/dynamic";
import FounderMessage from "@/components/FounderMessage";
import FAQ from "@/components/FAQ";
import ContactSection from "@/components/ContactSection";
import CTABanner from "@/components/CTABanner";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Zenfixin | Digital Marketing & Creative Media',
  description: 'Zenfixin is a digital marketing agency providing SEO, social media management, video editing, content creation, and brand strategy services.',
  openGraph: {
    title: 'Zenfixin | Digital Marketing & Creative Media',
    description: 'Zenfixin is a digital marketing agency providing SEO, social media management, video editing, content creation, and brand strategy services.',
    url: 'https://zenfixin.com/',
    siteName: 'Zenfixin',
    type: 'website',
  },
};

const TechStack = dynamic(() => import("@/components/TechStack/TechStack"), {
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan"></div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <FloatingContact />
      
      {/* 1. Hero */}
      <HeroSlider />

      {/* 2. Trusted By Marquee */}
      <QuoteSection />
      
      {/* 3. Services */}
      <ServicesSection />
      
      {/* 4. Why Choose Us */}
      <WhyChooseUs />
      
      {/* 5. Process */}
      <MarketingProcess />
      
      {/* 6. Work Process */}
      <WorkProcess />
      
      {/* 7. Technologies We Use */}
      <TechStack />
      
      {/* 8. Founder Message */}
      <FounderMessage />
      
      {/* 9. FAQ */}
      <FAQ />
      
      {/* 10. CTA Banner */}
      <CTABanner />
      
      {/* 11. Contact */}
      <ContactSection />
      
      {/* 12. Footer */}
      <Footer />
    </>
  );
}
