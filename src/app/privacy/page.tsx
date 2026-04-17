import type { Metadata } from 'next';
import Link from 'next/link';
import MetaPixel from '@/components/MetaPixel';
import Microconversions from '@/components/Microconversions';
import CustomCursor from '@/components/CustomCursor';
import SimpleFooter from '@/components/SimpleFooter';
import { PrivacyContent } from '@/lib/privacy-content';
import { siteConfig } from '@/lib/site.config';

export const metadata: Metadata = {
  title: siteConfig.privacy.title,
  description: siteConfig.privacy.description,
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <MetaPixel pixelId={siteConfig.metaPixelId} />
      <Microconversions page="privacy" pixelId={siteConfig.metaPixelId} />
      <CustomCursor />

      <div className="legal-page">
        {/* Page header */}
        <header className="legal-page-header page-header">
          <div className="ctn">
            <Link href="/" className="legal-back-link">
              ← Вернуться на сайт
            </Link>
            <h1 className="legal-page-title">Политика конфиденциальности</h1>
            <p className="legal-page-subtitle">
              Как мы собираем, используем и защищаем ваши персональные данные
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="legal-page-main content">
          <div className="ctn legal-ctn">
            <PrivacyContent />
          </div>
        </main>
      </div>

      <SimpleFooter />

      <style>{`
        .legal-page {
          min-height: 100vh;
          background: var(--bg, #000);
          color: var(--txt, #a1a1aa);
        }

        .legal-page-header {
          padding: 80px 0 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .legal-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0ee0cf;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 24px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .legal-back-link:hover { opacity: 1; }

        .legal-page-title {
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 800;
          color: #f4f4f5;
          line-height: 1.2;
          margin-bottom: 12px;
        }

        .legal-page-subtitle {
          font-size: 16px;
          color: #71717a;
        }

        .legal-page-main {
          padding: 64px 0 100px;
        }

        .legal-ctn {
          max-width: 800px;
        }

        .legal-content { }

        .legal-section {
          margin-bottom: 56px;
        }

        .legal-section h2 {
          font-size: 22px;
          font-weight: 700;
          color: #f4f4f5;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .legal-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #d4d4d8;
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .legal-section p {
          font-size: 15px;
          line-height: 1.75;
          color: #a1a1aa;
          margin-bottom: 12px;
        }

        .legal-section ul,
        .legal-section ol {
          padding-left: 20px;
          margin-bottom: 12px;
        }

        .legal-section li {
          font-size: 15px;
          line-height: 1.75;
          color: #a1a1aa;
          margin-bottom: 6px;
          list-style: disc;
        }

        .legal-section a {
          color: #0ee0cf;
          text-decoration: underline;
          text-decoration-color: rgba(14,224,207,0.3);
          transition: text-decoration-color 0.2s;
        }
        .legal-section a:hover {
          text-decoration-color: #0ee0cf;
        }

        .legal-table-wrap {
          overflow-x: auto;
          margin: 16px 0;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .legal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .legal-table th {
          background: rgba(255,255,255,0.04);
          color: #d4d4d8;
          font-weight: 600;
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          white-space: nowrap;
        }

        .legal-table td {
          padding: 10px 14px;
          color: #a1a1aa;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: top;
        }

        .legal-table tr:last-child td {
          border-bottom: none;
        }

        .legal-table tr:hover td {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </>
  );
}
