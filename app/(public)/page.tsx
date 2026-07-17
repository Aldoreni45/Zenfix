import HeroSlider from "@/components/HeroSlider";
import Achievements from "@/components/Achievements";
import WhyChooseUs from "@/components/WhyChooseUs";
import ServicesSection from "@/components/ServicesSection";
import MarketingProcess from "@/components/MarketingProcess";
import WorkProcess from "@/components/WorkProcess";
import CaseStudies from "@/components/CaseStudies";
import QuoteSection from "@/components/QuoteSection"; // Trusted By Marquee
import dynamic from "next/dynamic";
import FounderMessage from "@/components/FounderMessage";
import CompanyStats from "@/components/CompanyStats";
import TestimonialsSection from "@/components/TestimonialsSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import ContactSection from "@/components/ContactSection";
import CTABanner from "@/components/CTABanner";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";

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

      {/* 2. Achievements */}
      <Achievements />

      {/* 3. Trusted By Marquee */}
      <QuoteSection />
      
      {/* 3. Services */}
      <ServicesSection />
      
      {/* 4. Why Choose Us */}
      <WhyChooseUs />
      
      {/* 5. Process */}
      <MarketingProcess />
      
      {/* 6. Work Process */}
      <WorkProcess />
      
      {/* 7. Case Studies */}
      <CaseStudies />
      
      {/* 8. Technologies We Use */}
      <TechStack />
      
      {/* 7. Founder Message */}
      <FounderMessage />
      
      {/* 8. Company Stats */}
      <CompanyStats />
      
      {/* 9. Testimonials */}
      <TestimonialsSection />
      
      {/* 8. Pricing */}
      <Pricing />
      
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
