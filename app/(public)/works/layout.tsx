import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Work | Zenfixin Portfolio',
  description: 'View Zenfixin portfolio of digital marketing projects, creative campaigns, and successful client partnerships.',
  openGraph: {
    title: 'Our Work | Zenfixin Portfolio',
    description: 'View Zenfixin portfolio of digital marketing projects, creative campaigns, and successful client partnerships.',
    url: 'https://zenfixin.com/works/',
    siteName: 'Zenfixin',
    type: 'website',
  },
};

export default function WorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
