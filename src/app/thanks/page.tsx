import type { Metadata } from 'next';
import MetaPixel from '@/components/MetaPixel';
import Microconversions from '@/components/Microconversions';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';
import SimpleFooter from '@/components/SimpleFooter';
import ThanksClient from '@/components/ThanksClient';
import { siteConfig } from '@/lib/site.config';

export const metadata: Metadata = {
  title: siteConfig.thanks.title,
  robots: { index: false, follow: false },
};

const whatsappUrl = `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(siteConfig.whatsappText)}`;
const telegramUrl = `https://t.me/${siteConfig.telegramUsername}`;
const telegramBotUrl = `https://t.me/${siteConfig.telegramBot}`;
const telegramChannelUrl = `https://t.me/${siteConfig.telegramChannel}`;
const instagramUrl = `https://www.instagram.com/${siteConfig.instagram}`;

const checklists = siteConfig.thanks.checklists;

/* Icons are visual/non-translatable, so kept local; text comes from config */
const stepIcons = [
  <svg key="phone" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.18 19.79 19.79 0 01.43 4.6 2 2 0 012.41 2.4h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.38a16 16 0 006.63 6.63l.75-.75a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  <svg key="search" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
  <svg key="layout" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18M9 21V9" /></svg>,
  <svg key="bolt" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
];

const steps = siteConfig.thanks.steps.map((s, i) => ({
  icon: stepIcons[i],
  title: s.title,
  desc: s.desc,
  badge: s.badge || null,
}));

export default function ThanksPage() {
  return (
    <>
      <MetaPixel pixelId={siteConfig.metaPixelId} event="Lead" />
      <Microconversions page="thanks" pixelId={siteConfig.metaPixelId} />
      <CustomCursor />
      <NoiseOverlay />
      <ThanksClient />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(14,224,207,0.12) 0%, transparent 70%)',
        }}
      />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Hero section ── */}
        <section
          id="thanks-hero"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', width: '100%' }}>
            {/* Animated check circle */}
            <div
              style={{
                width: '96px',
                height: '96px',
                margin: '0 auto 32px',
                position: 'relative',
              }}
            >
              <svg
                viewBox="0 0 96 96"
                width="96"
                height="96"
                style={{ display: 'block' }}
              >
                {/* Spinning ring */}
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="rgba(14,224,207,0.2)"
                  strokeWidth="2"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="#0ee0cf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="276"
                  strokeDashoffset="276"
                  style={{
                    animation: 'ringDraw 1s ease forwards 0.2s',
                    transformOrigin: '48px 48px',
                    transform: 'rotate(-90deg)',
                  }}
                />
                {/* Inner circle */}
                <circle cx="48" cy="48" r="36" fill="rgba(14,224,207,0.1)" />
                {/* Checkmark */}
                <polyline
                  points="30,48 44,62 66,36"
                  fill="none"
                  stroke="#0ee0cf"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="60"
                  strokeDashoffset="60"
                  style={{
                    animation: 'checkDraw 0.5s ease forwards 0.9s',
                  }}
                />
              </svg>
              <style>{`
                @keyframes ringDraw {
                  to { stroke-dashoffset: 0; }
                }
                @keyframes checkDraw {
                  to { stroke-dashoffset: 0; }
                }
                @keyframes pulseDot {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(0.85); }
                }
                @keyframes fadeUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>

            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(14,224,207,0.08)',
                border: '1px solid rgba(14,224,207,0.2)',
                borderRadius: '100px',
                padding: '6px 16px',
                marginBottom: '24px',
                animation: 'fadeUp 0.5s ease forwards 1.1s',
                opacity: 0,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#0ee0cf',
                  flexShrink: 0,
                  animation: 'pulseDot 1.5s ease infinite',
                }}
              />
              <span style={{ fontSize: '13px', color: '#0ee0cf', fontWeight: 500 }}>
                {siteConfig.thanks.badge}
              </span>
            </div>

            {/* H1 */}
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: 800,
                lineHeight: 1.1,
                color: '#f4f4f5',
                marginBottom: '16px',
                animation: 'fadeUp 0.5s ease forwards 1.2s',
                opacity: 0,
              }}
            >
              {siteConfig.thanks.heading}
              <span
                style={{
                  background: 'linear-gradient(135deg, #0ee0cf 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                !
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '18px',
                color: '#a1a1aa',
                lineHeight: 1.7,
                marginBottom: '12px',
                animation: 'fadeUp 0.5s ease forwards 1.3s',
                opacity: 0,
              }}
            >
              {siteConfig.thanks.subtitle}
            </p>

            {/* Hook */}
            <p
              style={{
                fontSize: '15px',
                color: '#71717a',
                marginBottom: '32px',
                animation: 'fadeUp 0.5s ease forwards 1.4s',
                opacity: 0,
              }}
            >
              {siteConfig.thanks.hook}
            </p>

            {/* CTA button */}
            <a
              href="#checklists"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0ee0cf 0%, #0ab8aa 100%)',
                color: '#000',
                fontWeight: 700,
                fontSize: '15px',
                padding: '14px 32px',
                borderRadius: '100px',
                textDecoration: 'none',
                animation: 'fadeUp 0.5s ease forwards 1.5s',
                opacity: 0,
              }}
            >
              {siteConfig.thanks.ctaHero}
            </a>

            {/* Messenger card */}
            <div
              style={{
                marginTop: '48px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '28px 32px',
                animation: 'fadeUp 0.5s ease forwards 1.6s',
                opacity: 0,
              }}
            >
              <p style={{ color: '#a1a1aa', fontSize: '15px', marginBottom: '20px' }}>
                {siteConfig.thanks.messengerNote}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#25D366',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '12px 24px',
                    borderRadius: '100px',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#26A5E4',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '12px 24px',
                    borderRadius: '100px',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Checklists section ── */}
        <section
          id="checklists"
          style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.01)' }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(14,224,207,0.08)',
                border: '1px solid rgba(14,224,207,0.2)',
                borderRadius: '100px',
                padding: '5px 14px',
                marginBottom: '24px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#0ee0cf', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {siteConfig.thanks.bonusLabel}
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 800,
                color: '#f4f4f5',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              {siteConfig.thanks.bonusHeading}
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '17px', marginBottom: '48px', maxWidth: '560px' }}>
              {siteConfig.thanks.bonusDescription}
            </p>

            {/* 2x2 grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '40px',
              }}
            >
              {checklists.map((item) => (
                <a
                  key={item.num}
                  href={telegramBotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.2s, background 0.2s',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0ee0cf',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.num}
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f4f4f5', lineHeight: 1.3 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#71717a', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </a>
              ))}
            </div>

            {/* Note + CTA */}
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '20px' }}>
              {siteConfig.thanks.bonusNote}
            </p>
            <a
              href={telegramBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0ee0cf 0%, #0ab8aa 100%)',
                color: '#000',
                fontWeight: 700,
                fontSize: '15px',
                padding: '14px 32px',
                borderRadius: '100px',
                textDecoration: 'none',
              }}
            >
              {siteConfig.thanks.bonusCta}
            </a>
          </div>
        </section>

        {/* ── Timeline section ── */}
        <section
          id="whats-next"
          style={{ padding: '100px 24px' }}
        >
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 800,
                color: '#f4f4f5',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              {siteConfig.thanks.timelineHeading}
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '17px', marginBottom: '56px' }}>
              {siteConfig.thanks.timelineDescription}
            </p>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    position: 'relative',
                  }}
                >
                  {/* Left column: icon + line */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(14,224,207,0.1)',
                        border: '1px solid rgba(14,224,207,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0ee0cf',
                        flexShrink: 0,
                      }}
                    >
                      {step.icon}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        style={{
                          width: '1px',
                          flex: 1,
                          minHeight: '40px',
                          background:
                            'linear-gradient(to bottom, rgba(14,224,207,0.3) 0%, rgba(14,224,207,0.05) 100%)',
                          margin: '4px 0',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ paddingBottom: i < steps.length - 1 ? '36px' : '0', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f4f4f5' }}>
                        {step.title}
                      </h3>
                      {step.badge && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#fbbf24',
                            background: 'rgba(251,191,36,0.1)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            padding: '2px 10px',
                            borderRadius: '100px',
                          }}
                        >
                          {step.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '15px', color: '#71717a', lineHeight: 1.6 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Subscribe section ── */}
        <section
          id="subscribe"
          style={{
            padding: '80px 24px',
            background: 'rgba(255,255,255,0.01)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(22px, 4vw, 36px)',
                fontWeight: 700,
                color: '#f4f4f5',
                marginBottom: '12px',
                lineHeight: 1.3,
              }}
            >
              {siteConfig.thanks.subscribeHeading}
            </h2>
            <p style={{ color: '#71717a', fontSize: '15px', marginBottom: '32px' }}>
              {siteConfig.thanks.subscribeDescription}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#26A5E4',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px 24px',
                  borderRadius: '100px',
                  textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram-канал
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px 24px',
                  borderRadius: '100px',
                  textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </a>
            </div>
          </div>
        </section>
      </main>

      <SimpleFooter />
    </>
  );
}
