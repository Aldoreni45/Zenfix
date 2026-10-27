import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function UncategorizedPage() {
  // Return 410 Gone for this WordPress category page that no longer exists
  return notFound();
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
