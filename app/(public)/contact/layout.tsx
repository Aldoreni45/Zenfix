import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Zenfixin | Digital Marketing & Creative Services',
  description: 'Get in touch with Zenfixin for digital marketing services. Contact us via phone, email, or visit our office in Tamil Nadu.',
  openGraph: {
    title: 'Contact Zenfixin | Digital Marketing & Creative Services',
    description: 'Get in touch with Zenfixin for digital marketing services. Contact us via phone, email, or visit our office in Tamil Nadu.',
    url: 'https://zenfixin.com/contact/',
    siteName: 'Zenfixin',
    type: 'website',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
