import HeroSlider from "@/components/HeroSlider";
import WhyChooseUs from "@/components/WhyChooseUs";
import ServicesSection from "@/components/ServicesSection";
import MarketingProcess from "@/components/MarketingProcess";
import WorkProcess from "@/components/WorkProcess";
import CaseStudies from "@/components/CaseStudies";
import QuoteSection from "@/components/QuoteSection"; // Trusted By Marquee
import TechMarquee from "@/components/TechMarquee";
import FounderMessage from "@/components/FounderMessage";
import CompanyStats from "@/components/CompanyStats";
import TestimonialsSection from "@/components/TestimonialsSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import ContactSection from "@/components/ContactSection";
import CTABanner from "@/components/CTABanner";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";

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
      
      {/* 7. Case Studies */}
      <CaseStudies />
      
      {/* 8. Technologies We Use */}
      <TechMarquee />
      
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
