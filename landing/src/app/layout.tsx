import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/Toaster';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const title = 'Cocount — CRM para inmobiliarias en España | Alquiler, Venta e Idealista';
const description =
  'CRM inmobiliario en la nube: importa clientes de Idealista, gestiona alquiler y venta con tablas tipo Excel, WhatsApp integrado y Google Calendar. Demo gratuita.';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cocount.es'),
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'es_ES',
    siteName: 'Cocount',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  keywords: [
    'CRM inmobiliario España',
    'software inmobiliaria',
    'gestión alquiler venta',
    'Idealista leads',
    'CRM inmobiliaria Barcelona',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
