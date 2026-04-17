import type { Metadata } from 'next';
import MetaPixel from '@/components/MetaPixel';
import Microconversions from '@/components/Microconversions';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';
import ScrollProgress from '@/components/ScrollProgress';
import SimpleFooter from '@/components/SimpleFooter';
import { siteConfig } from '@/lib/site.config';
import NotFoundClient from './not-found-client';

export const metadata: Metadata = {
  title: siteConfig.notFound.title,
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <>
      {/* MetaPixel: fires PageView on load */}
      <MetaPixel pixelId={siteConfig.metaPixelId} />
      {/* NotFoundClient also fires View404 custom event via trackEvent */}
      <Microconversions page="404" pixelId={siteConfig.metaPixelId} />
      <CustomCursor />
      <NoiseOverlay />
      <ScrollProgress />

      <NotFoundClient />

      <SimpleFooter />
    </>
  );
}
