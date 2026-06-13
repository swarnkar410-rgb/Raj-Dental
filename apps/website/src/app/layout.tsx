import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Raj Dental & Implant Hospital | Best Dentist in Patna',
  description: 'Raj Dental & Implant Hospital (Established 2009) led by Dr. Manoj Kumar. Advanced dental implant, cosmetic smile makeover, braces, and laser dentistry in Patna, Bihar.',
  keywords: 'dentist in patna, dental clinic patna, dental implant patna, root canal patna, dr manoj kumar dentist, raj dental hospital patna',
  authors: [{ name: 'Dr. Manoj Kumar' }]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-[#0B1220] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
