import "./globals.css";
import { Sora } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "sonner";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "ZENFIX | Grow Smarter. Market Better. Scale Faster.",
  description: "ZenFix is a full-service Digital Growth Agency helping startups, local businesses, and enterprises accelerate growth through Digital Marketing, SEO, Google Ads, Meta Ads, Social Media Management, Lead Generation, Website Development, Web Applications, Mobile App Development, Branding, UI/UX Design, AI Automation, Content Marketing, Email Marketing, and Performance Marketing.",
  keywords: ["Digital Marketing Agency", "SEO", "Google Ads", "Meta Ads", "Social Media Management", "Lead Generation", "Website Development", "Mobile App Development", "Branding", "UI/UX Design", "AI Automation", "Content Marketing", "Email Marketing", "Performance Marketing"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable}`}>
      <body className={`${sora.className} bg-background text-foreground antialiased overflow-x-hidden`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}