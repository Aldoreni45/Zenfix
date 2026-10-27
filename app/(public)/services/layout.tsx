import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Digital Marketing Services | Zenfixin',
  description: 'Explore Zenfixin comprehensive digital marketing services including SEO, social media management, Google Ads, content creation, video editing, and brand strategy.',
  openGraph: {
    title: 'Digital Marketing Services | Zenfixin',
    description: 'Explore Zenfixin comprehensive digital marketing services including SEO, social media management, Google Ads, content creation, video editing, and brand strategy.',
    url: 'https://zenfixin.com/services/',
    siteName: 'Zenfixin',
    type: 'website',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
