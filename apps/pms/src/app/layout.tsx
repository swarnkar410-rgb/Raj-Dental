import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Raj Dental PMS | Dashboard',
  description: 'Raj Dental Practice Management System. Exclusively for Dr. Manoj Kumar.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0B1220] text-white antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
