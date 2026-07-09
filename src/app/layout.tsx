import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Forensic Case Management System',
  description: 'A secure, modern, full-stack Laboratory Operations and Custody Management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
