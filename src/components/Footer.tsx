import Link from 'next/link';
import { siteConfig } from '@/lib/site.config';

export default function Footer() {
  const year = new Date().getFullYear();

  const whatsappHref = `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(siteConfig.whatsappText)}`;
  const telegramHref = `https://t.me/${siteConfig.telegramUsername}`;
  const instagramHref = `https://www.instagram.com/${siteConfig.instagram}/`;

  return (
    <footer className="footer">
      <div className="ctn">
        {/* ── Top grid: 3 columns ── */}
        <div className="footer-top">
          {/* Column 1 — Контакты */}
          <div className="footer-col">
            <p className="footer-col-title">{siteConfig.footer.colContacts}</p>
            <ul className="footer-links">
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 — Навигация */}
          <div className="footer-col">
            <p className="footer-col-title">{siteConfig.footer.colNav}</p>
            <ul className="footer-links">
              {siteConfig.footerNav.map((item) => (
                <li key={item.href + item.label}>
                  <a href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Ещё */}
          <div className="footer-col">
            <p className="footer-col-title">{siteConfig.footer.colExtra}</p>
            <ul className="footer-links">
              <li>
                <Link href="/privacy">
                  {siteConfig.footer.privacyLink}
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  {siteConfig.footer.termsLink}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {year} {siteConfig.name}. {siteConfig.footer.copyright}
          </p>

          <nav className="footer-legal" aria-label={siteConfig.footer.copyright}>
            <Link href="/privacy">{siteConfig.footer.privacyLink}</Link>
            <Link href="/terms">{siteConfig.footer.termsLink}</Link>
          </nav>

          <a
            href={`https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(siteConfig.whatsappText)}`}
            className="footer-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {siteConfig.footer.ctaLink} &rarr;
          </a>
        </div>
      </div>
    </footer>
  );
}
