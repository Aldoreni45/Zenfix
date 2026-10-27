import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Client Testimonials | Zenfixin',
  description: 'Read what our clients say about working with Zenfixin for their digital marketing and creative media needs.',
  openGraph: {
    title: 'Client Testimonials | Zenfixin',
    description: 'Read what our clients say about working with Zenfixin for their digital marketing and creative media needs.',
    url: 'https://zenfixin.com/testimonial/',
    siteName: 'Zenfixin',
    type: 'website',
  },
};

export default function TestimonialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
