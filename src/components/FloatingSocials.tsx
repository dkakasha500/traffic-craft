import { siteConfig } from '@/lib/site.config';

/* ── Inline SVG icons ── */

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="22"
      height="22"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L0 24l6.18-1.57A11.96 11.96 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.23-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.23-1.44l-.37-.22-3.67.93.97-3.56-.24-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm5.47-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51H7.5c-.17 0-.45.07-.69.35-.23.27-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.82 2.78 4.4 3.9.62.27 1.1.43 1.47.55.62.2 1.18.17 1.63.1.5-.07 1.53-.62 1.74-1.23.22-.6.22-1.12.15-1.23-.07-.1-.27-.17-.57-.32z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="22"
      height="22"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.13 13.953l-2.947-.924c-.64-.203-.654-.64.136-.949l11.57-4.461c.537-.194 1.006.131.836.602z" />
    </svg>
  );
}

/* ── Component ── */

export default function FloatingSocials() {
  const whatsappHref = `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(siteConfig.whatsappText)}`;
  const telegramHref = `https://t.me/${siteConfig.telegramUsername}`;

  return (
    <div className="floating-socials" aria-label="Связаться с нами">
      <a
        href={telegramHref}
        className="social-btn social-btn-tg"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в Telegram"
        title="Написать в Telegram"
      >
        <TelegramIcon />
        <span className="social-btn-label">Telegram</span>
      </a>

      <a
        href={whatsappHref}
        className="social-btn social-btn-wa"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в WhatsApp"
        title="Написать в WhatsApp"
      >
        <WhatsAppIcon />
        <span className="social-btn-label">WhatsApp</span>
      </a>
    </div>
  );
}
