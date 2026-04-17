import Link from 'next/link';
import { siteConfig } from '@/lib/site.config';

export default function SimpleFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="ctn">
        <div className="site-footer-in">
          {/* Copyright */}
          <p className="site-footer-copy">
            &copy; {year} {siteConfig.name}. {siteConfig.footer.copyright}
          </p>

          {/* Legal navigation */}
          <nav className="site-footer-links" aria-label={siteConfig.footer.copyright}>
            <Link href="/privacy">
              {siteConfig.footer.privacyLink}
            </Link>
            <Link href="/terms">
              {siteConfig.footer.termsLink}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
