import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Zenfixin | Digital Marketing & Creative Media',
  description: 'Learn about Zenfixin - a digital marketing agency providing SEO, social media management, video editing, content creation, and brand strategy services.',
  openGraph: {
    title: 'About Zenfixin | Digital Marketing & Creative Media',
    description: 'Learn about Zenfixin - a digital marketing agency providing SEO, social media management, video editing, content creation, and brand strategy services.',
    url: 'https://zenfixin.com/about-us/',
    siteName: 'Zenfixin',
    type: 'website',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
