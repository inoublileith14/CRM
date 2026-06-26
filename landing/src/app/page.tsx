import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { ComparisonSection } from '@/components/sections/ComparisonSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { FinalCtaSection } from '@/components/sections/FinalCtaSection';
import { HeroSection } from '@/components/sections/HeroSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { PainPointsSection } from '@/components/sections/PainPointsSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { TrustSection } from '@/components/sections/TrustSection';
import { SITE_URL } from '@/lib/copy';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Cocount',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'CRM inmobiliario en la nube para gestionar alquiler, venta, leads de Idealista y equipo.',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '49',
        highPrice: '199',
        priceCurrency: 'EUR',
        offerCount: '3',
      },
      url: SITE_URL,
    },
    {
      '@type': 'Organization',
      name: 'Cocount',
      url: SITE_URL,
      email: 'hola@cocount.es',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Barcelona',
        addressCountry: 'ES',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav />
      <main>
        <HeroSection />
        <PainPointsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ComparisonSection />
        <PricingSection />
        <TrustSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
      <StickyMobileCta />
    </>
  );
}
