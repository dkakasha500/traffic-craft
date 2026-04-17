import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site.config';
import MetaPixel from '@/components/MetaPixel';
import Microconversions from '@/components/Microconversions';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';
import ScrollProgress from '@/components/ScrollProgress';
import CTAForm from '@/components/CTAForm';
import Footer from '@/components/Footer';
import FloatingSocials from '@/components/FloatingSocials';
import LogoSvg from '@/components/LogoSvg';
import HomeClient from '@/components/HomeClient';

/* ============================================================
   METADATA
   ============================================================ */
export const metadata: Metadata = {
  title: siteConfig.home.title,
  description: siteConfig.home.description,
  openGraph: {
    title: siteConfig.home.ogTitle,
    description: siteConfig.home.ogDescription,
    url: siteConfig.domain,
    images: [`${siteConfig.domain}/og-image.png`],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.home.ogTitle,
    description: siteConfig.home.ogDescription,
    images: [`${siteConfig.domain}/og-image.png`],
  },
  alternates: {
    canonical: '/',
  },
};

/* ============================================================
   INLINE SVG ICON HELPERS
   ============================================================ */

function IconCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPulse() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }}>
      <circle cx="10" cy="10" r="3" fill="currentColor" />
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
    </svg>
  );
}


function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }}>
      <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================
   STATS ICON HELPERS
   ============================================================ */

function StatIcon({ index }: { index: number }) {
  const icons = [
    // Users icon
    <svg key={0} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: 'var(--accent)' }} aria-hidden="true">
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    // Chart icon
    <svg key={1} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: 'var(--gold)' }} aria-hidden="true">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    // Briefcase icon
    <svg key={2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: 'var(--blue)' }} aria-hidden="true">
      <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
    // Clock icon
    <svg key={3} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: 'var(--green)' }} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
  ];
  return icons[index] ?? icons[0];
}

/* ============================================================
   PROCESS STEP ICONS
   ============================================================ */

function ProcessStepIcon({ num }: { num: string }) {
  if (num === '01') {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: 'var(--accent)' }} aria-hidden="true">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (num === '02') {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: 'var(--accent)' }} aria-hidden="true">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (num === '03') {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: 'var(--accent)' }} aria-hidden="true">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // 04
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: 'var(--accent)' }} aria-hidden="true">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================
   APPROACH PRINCIPLES
   ============================================================ */

/* principles and metricAbbrs are now in siteConfig.approach */

/* Chart bar heights removed — using SVG curve instead */

/* ============================================================
   PAGE COMPONENT
   ============================================================ */

export default function HomePage() {
  const whatsappHref = `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(siteConfig.whatsappText)}`;
  const telegramHref = `https://t.me/${siteConfig.telegramUsername}`;

  return (
    <>
      {/* ── Tracking ── */}
      <MetaPixel pixelId={siteConfig.metaPixelId} />
      <Microconversions page="leadgen" pixelId={siteConfig.metaPixelId} />

      {/* ── UI Chrome ── */}
      <NoiseOverlay />
      <CustomCursor />
      <ScrollProgress />

      {/* ── Client-side interactivity ── */}
      <HomeClient />

      {/* ================================================================
          NAVIGATION
          ================================================================ */}
      <nav id="main-nav" className="nav" role="navigation" aria-label="Основная навигация">
        <div className="ctn">
          <div className="nav-in">
            {/* Logo */}
            <Link href="/" className="logo" aria-label="Traffic Craft — главная">
              <span style={{ width: 32, height: 32, display: 'flex', flexShrink: 0 }}>
                <LogoSvg />
              </span>
              <span>
                Traffic{' '}
                <span style={{ color: 'var(--accent)' }}>Craft</span>
              </span>
            </Link>

            {/* Nav links */}
            <ul className="nav-links" role="list">
              {siteConfig.nav.map((item) => (
                <li key={item.href + item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>

            {/* Right controls */}
            <div className="nav-right">
              <span className="lang-switcher" aria-label="Выбор языка">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M8 1.5C8 1.5 6 4 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4 10 8s-2 6.5-2 6.5M1.5 8h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <strong style={{ color: 'var(--txt)' }}>RU</strong>
                <span style={{ opacity: 0.4 }}>/</span>
                <span>EN</span>
              </span>

              <a
                id="nav-cta-btn"
                href="#cta"
                className="nav-cta"
                style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.3s ease' }}
              >
                {siteConfig.ui.navCta}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ================================================================
          HERO
          ================================================================ */}
      <section id="hero" className="hero" aria-labelledby="hero-heading">
        {/* Decorative elements */}
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="hero-glow-1" aria-hidden="true" />
        <div className="hero-glow-2" aria-hidden="true" />

        <div className="ctn">
          <div className="hero-layout">
            {/* ── Left: Content ── */}
            <div className="hero-content">
              <p className="label reveal-1">{siteConfig.hero.eyebrow}</p>

              <h1 id="hero-heading" className="hero-h1">
                <span className="reveal-2" style={{ display: 'block' }}>
                  {siteConfig.hero.headingLine1}
                </span>
                <span className="reveal-3" style={{ display: 'block' }}>
                  <span className="accent">{siteConfig.hero.headingLine2Accent}</span>
                  {siteConfig.hero.headingLine2Rest}
                </span>
              </h1>

              <p className="hero-desc reveal-4">{siteConfig.hero.description}</p>

              {/* Channel tags */}
              <div className="hero-channels" role="list" aria-label="Рекламные каналы">
                {siteConfig.hero.channels.map((ch) => (
                  <span key={ch.name} className="hero-tag" role="listitem">
                    <span
                      className="tag-icon"
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: ch.color,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    {ch.name}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="hero-ctas">
                <a href="#cta" className="btn-primary">
                  {siteConfig.hero.ctaPrimary}
                </a>
                <a href="#cases" className="btn-secondary">
                  {siteConfig.hero.ctaSecondary}
                </a>
              </div>
            </div>

            {/* ── Right: Dashboard ── */}
            <div className="hero-dash-wrap" aria-label="Ключевые метрики проектов">
              <div className="animated-border" aria-hidden="true">
                <div className="hero-dash">
                  {/* Header */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--txt2)',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      marginBottom: 16,
                    }}
                  >
                    {siteConfig.dashboard.header}
                  </div>

                  {/* Metrics grid (2×2) */}
                  <div
                    className="dash-metrics"
                    style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
                  >
                    {siteConfig.dashboard.metrics.map((m) => (
                      <div key={m.label} className="dash-metric">
                        <div
                          className="dash-metric-val"
                          style={{
                            color:
                              m.color === 'green'
                                ? 'var(--accent)'
                                : m.color === 'gold'
                                ? 'var(--gold)'
                                : 'var(--heading)',
                            textShadow:
                              m.color === 'green'
                                ? '0 0 20px rgba(14,224,207,0.4)'
                                : m.color === 'gold'
                                ? '0 0 20px rgba(251,191,36,0.3)'
                                : undefined,
                          }}
                        >
                          {m.value}
                        </div>
                        <div className="dash-metric-lbl">
                          {m.label.replace('\n', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart — smooth SVG curve like original */}
                  <div className="dash-chart" aria-label="График записей">
                    <svg viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".4" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <path d="M0 40 Q30 38 60 35 T120 28 T180 18 T240 10 T300 4" stroke="var(--accent)" strokeWidth="2" fill="none" filter="url(#glow)" />
                      <path d="M0 40 Q30 38 60 35 T120 28 T180 18 T240 10 T300 4 L300 48 L0 48Z" fill="url(#cg)" />
                    </svg>
                  </div>

                  {/* Badge at bottom */}
                  <div className="dash-badge">
                    <span className="dash-badge-dot" />
                    {' '}{siteConfig.dashboard.badge}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          STATS
          ================================================================ */}
      <section className="stats-sec" aria-labelledby="stats-heading">
        <div className="ctn">
          <h2 id="stats-heading" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
            {siteConfig.ui.statsHeading}
          </h2>
          <div className="stats-grid" role="list">
            {siteConfig.stats.map((stat, i) => (
              <div key={stat.label} className="stat-card" role="listitem" data-reveal data-reveal-d={String(i * 0.15)}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--brd)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                  aria-hidden="true"
                >
                  <StatIcon index={i} />
                </div>
                <div className="stat-num" {...('countTo' in stat ? { 'data-count': String(stat.countTo) } : {})}>
                  {stat.value}
                  {'unit' in stat ? stat.unit : ''}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="stats-sub" aria-label="Дополнительные характеристики">
            {siteConfig.statsSub.map((s, i) => (
              <span key={s}>
                {i > 0 && (
                  <span style={{ margin: '0 12px', opacity: 0.3 }}>·</span>
                )}
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          MARQUEE
          ================================================================ */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee-track">
          {[...siteConfig.marqueeItems, ...siteConfig.marqueeItems].map((item, i) => (
            <span key={`${item}-${i}`} className="marquee-item">
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L9 8.75l-3.09 1.759.59-3.44L4 4.632l3.455-.502L9 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ================================================================
          PROBLEMS
          ================================================================ */}
      <section id="problems" className="sec" aria-labelledby="problems-heading">
        <div className="ctn">
          <div className="problems-wrap">
            {/* Left: problem cards */}
            <div>
              <h2 id="problems-heading" className="heading" data-reveal style={{ marginBottom: 40, whiteSpace: 'pre-line' }}>
                {siteConfig.problems.heading}
              </h2>
              <div className="problems-list">
                {siteConfig.problems.items.map((problem, i) => (
                  <div key={i} className="problem-card spotlight-card" data-reveal data-reveal-d={String(0.1 + i * 0.12)}>
                    <div className="problem-num">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <p className="problem-desc">{problem}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: с кем работаем */}
            <div>
              <div className="clinics-card spotlight-card" data-reveal data-reveal-d="0.2">
                <div className="clinics-card-header">
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--heading)',
                        marginBottom: 4,
                      }}
                    >
                      {siteConfig.clinics.title}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--txt2)' }}>
                      {siteConfig.clinics.subtitle}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--accent-mid)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, color: 'var(--accent)' }}>
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m-2 0h2m0 0V9a2 2 0 012-2h4m4 0h-4m0 0v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="clinics-card-body">
                  <div style={{ display: 'flex', flexWrap: 'wrap', margin: -4 }}>
                    {siteConfig.clinics.items.map((clinic, i) => (
                      <span
                        key={clinic}
                        className={`clinic-tag${i < 2 ? ' active' : ''}`}
                      >
                        {clinic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reassurance block */}
              <div
                style={{
                  marginTop: 20,
                  padding: '20px 24px',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-mid)',
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <IconPulse />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.4 }}>
                    {siteConfig.problemsReassurance.title}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--txt)', lineHeight: 1.6 }}>
                  {siteConfig.problemsReassurance.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          DIVIDER
          ================================================================ */}
      <div className="divider-diamond" aria-hidden="true" />

      {/* ================================================================
          CASES
          ================================================================ */}
      <section id="cases" className="sec" aria-labelledby="cases-heading">
        <div className="ctn">
          <div className="sec-header" data-reveal>
            <p className="label">{siteConfig.sectionLabels.casesLabel}</p>
            <h2 id="cases-heading" className="sec-heading">
              {siteConfig.sectionLabels.casesHeading}
            </h2>
            <p className="sec-subheading">
              {siteConfig.sectionLabels.casesSubheading}
            </p>
          </div>

          <div className="cases-grid">
            {siteConfig.cases.map((c) => (
              <article key={c.name} className="case spotlight-card">
                {/* Top icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-mid)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 22, height: 22, color: 'var(--accent)' }}>
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m-2 0h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="case-badge">{c.badge}</div>
                <h3 className="case-name">{c.name}</h3>

                <div className="case-tags">
                  {c.tags.map((tag) => (
                    <span key={tag} className="case-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="case-rows">
                  <div className="case-row">
                    <span className="case-row-label">{siteConfig.ui.caseBudgetLabel}</span>
                    <span className="case-row-val">
                      {c.budget}{' '}
                      <span
                        style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 400 }}
                      >
                        ≈ {c.budgetUsd}
                      </span>
                    </span>
                  </div>
                  <div className="case-row">
                    <span className="case-row-label">{siteConfig.ui.caseRecordsLabel}</span>
                    <span
                      className="case-row-val"
                      style={{ color: 'var(--green)' }}
                    >
                      {c.records}
                    </span>
                  </div>
                </div>

                <div className="case-roi">
                  <span className="case-roi-label">ROI</span>
                  <span className="case-roi-val">{c.roi}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Cases more */}
          <div
            style={{
              marginTop: 40,
              padding: '24px 32px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--brd)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  marginBottom: 6,
                }}
              >
                {siteConfig.casesExtra.heading}
              </p>
              <p style={{ fontSize: 13, color: 'var(--txt2)' }}>
                {siteConfig.casesExtra.description}
              </p>
            </div>
            <a href="#cta" className="btn-secondary" style={{ flexShrink: 0 }}>
              {siteConfig.casesExtra.ctaText}
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================
          REVIEWS
          ================================================================ */}
      <section id="reviews" className="sec" aria-labelledby="reviews-heading">
        <div className="ctn">
          <div className="sec-header" data-reveal>
            <p className="label">{siteConfig.reviews.label}</p>
            <h2 id="reviews-heading" className="sec-heading">
              {siteConfig.reviews.heading}
            </h2>
          </div>

          <div className="reviews-layout">
            {/* Left: main review */}
            <div className="review-col">
              {siteConfig.reviews.items
                .filter((r) => r.main)
                .map((r, i) => {
                  const avatarStyles: Record<string, React.CSSProperties> = {
                    default: {},
                    blue: {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.3))',
                      color: 'var(--blue)',
                      borderColor: 'rgba(59,130,246,0.3)',
                    },
                    gold: {
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.2))',
                      color: 'var(--gold)',
                      borderColor: 'rgba(251,191,36,0.25)',
                    },
                  };
                  return (
                    <article key={i} className="review-card main-review spotlight-card" data-reveal aria-label={`Отзыв — ${r.name}`}>
                      <div className="review-header">
                        <div
                          className="review-avatar"
                          aria-hidden="true"
                          style={avatarStyles[r.avatarStyle] ?? {}}
                        >
                          {r.avatar}
                        </div>
                        <div className="review-meta">
                          <div className="review-name">{r.name}</div>
                          <div className="review-pos">{r.position}</div>
                        </div>
                      </div>
                      <div className="review-stars" aria-label="Оценка: 5 из 5 звёзд">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className="review-star" aria-hidden="true">★</span>
                        ))}
                      </div>
                      <p className="review-text">{r.text}</p>
                      <span className="review-badge">{siteConfig.ui.reviewBadge}</span>
                    </article>
                  );
                })}
            </div>

            {/* Right: secondary reviews */}
            <div className="review-col">
              {siteConfig.reviews.items
                .filter((r) => !r.main)
                .map((r, i) => {
                  const avatarStyles: Record<string, React.CSSProperties> = {
                    default: {},
                    blue: {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.3))',
                      color: 'var(--blue)',
                      borderColor: 'rgba(59,130,246,0.3)',
                    },
                    gold: {
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.2))',
                      color: 'var(--gold)',
                      borderColor: 'rgba(251,191,36,0.25)',
                    },
                  };
                  return (
                    <article key={i} className="review-card spotlight-card" data-reveal aria-label={`Отзыв — ${r.name}`}>
                      <div className="review-header">
                        <div
                          className="review-avatar"
                          aria-hidden="true"
                          style={avatarStyles[r.avatarStyle] ?? {}}
                        >
                          {r.avatar}
                        </div>
                        <div className="review-meta">
                          <div className="review-name">{r.name}</div>
                          <div className="review-pos">{r.position}</div>
                        </div>
                      </div>
                      <div className="review-stars" aria-label="Оценка: 5 из 5 звёзд">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className="review-star" aria-hidden="true">★</span>
                        ))}
                      </div>
                      <p className="review-text">{r.text}</p>
                      <span className="review-badge">{siteConfig.ui.reviewBadge}</span>
                    </article>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PROCESS
          ================================================================ */}
      <section id="process" className="sec" aria-labelledby="process-heading">
        <div className="ctn">
          <div className="sec-header" data-reveal>
            <p className="label">{siteConfig.sectionLabels.processLabel}</p>
            <h2 id="process-heading" className="sec-heading">
              {siteConfig.sectionLabels.processHeading}
            </h2>
            <p className="sec-subheading">
              {siteConfig.sectionLabels.processSubheading}
            </p>
          </div>

          <div className="process-grid" data-reveal>
            {siteConfig.process.map((step) => (
              <div key={step.num} className="process-step">
                <div className="process-icon">
                  <ProcessStepIcon num={step.num} />
                  <span className="process-icon-num" aria-hidden="true">
                    {step.num}
                  </span>
                </div>
                <h3 className="process-title">{step.title}</h3>
                <p className="process-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          APPROACH
          ================================================================ */}
      <section id="approach" className="sec" style={{ background: 'var(--bg2)' }} aria-labelledby="approach-heading">
        <div className="ctn">
          <div className="approach-grid">
            {/* Left */}
            <div>
              <p className="label">{siteConfig.approach.label}</p>
              <h2 id="approach-heading" className="heading" style={{ marginBottom: 20 }}>
                {siteConfig.approach.heading}{' '}
                <span className="accent">{siteConfig.approach.headingAccent}</span>
              </h2>
              <p className="body-text" style={{ marginBottom: 32 }}>
                {siteConfig.approach.description}
              </p>

              {/* Metrics abbreviations */}
              <div className="metrics-abbr" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 32 }}>
                {siteConfig.approach.metricAbbrs.map((m) => (
                  <div key={m.val} className="metric-abbr-card">
                    <div className="metric-abbr-val">{m.val}</div>
                    <div className="metric-abbr-lbl">{m.lbl}</div>
                  </div>
                ))}
              </div>

              <a href="#cta" className="btn-primary" style={{ display: 'inline-flex' }}>
                {siteConfig.approach.ctaText}
              </a>
            </div>

            {/* Right: principles */}
            <div>
              <div className="principles-list" role="list">
                {siteConfig.approach.principles.map((p) => (
                  <div key={p.title} className="principle-item" role="listitem">
                    <div className="principle-icon" aria-hidden="true">
                      {p.icon}
                    </div>
                    <div className="principle-content">
                      <div className="principle-title">{p.title}</div>
                      <div className="principle-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          ABOUT
          ================================================================ */}
      <section className="sec" aria-labelledby="about-heading">
        <div className="ctn">
          <div
            className="about-new-card spotlight-card"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {/* Glow */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14,224,207,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <p className="label">{siteConfig.about.label}</p>
              <h2
                id="about-heading"
                className="heading"
                style={{ maxWidth: 700, marginBottom: 20 }}
              >
                {siteConfig.about.heading}{' '}
                <span className="accent">{siteConfig.about.headingAccent}</span>
              </h2>
              {siteConfig.about.paragraphs.map((p, i) => (
                <p key={i} className="body-text" style={{ maxWidth: 680, marginBottom: i < siteConfig.about.paragraphs.length - 1 ? 16 : 0 }}>
                  {p}
                </p>
              ))}

              <div className="about-tags">
                {siteConfig.about.tags.map(
                  (tag) => (
                    <span key={tag} className="about-tag">
                      <IconCheck />
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          LIVE LEAD DEFINITION
          ================================================================ */}
      <section id="liveLead" className="sec-sm" aria-labelledby="lead-def-heading">
        <div className="ctn">
          <div className="lead-def" data-reveal>
            <p className="label" style={{ justifyContent: 'center' }}>{siteConfig.liveLead.label}</p>
            <blockquote className="lead-quote" id="lead-def-heading">
              {siteConfig.liveLead.quote}
            </blockquote>
            <p className="lead-pulse">
              {siteConfig.liveLead.pulse}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA
          ================================================================ */}
      <section id="cta" className="cta-sec" aria-labelledby="cta-heading">
        <div className="ctn">
          <div className="cta-card" data-reveal>
            <div className="cta-glow" aria-hidden="true" />

            <p className="label" style={{ justifyContent: 'center' }}>
              {siteConfig.ui.ctaLabel}
            </p>
            <h2
              id="cta-heading"
              className="heading"
              style={{
                marginBottom: 16,
                textAlign: 'center',
                whiteSpace: 'pre-line',
              }}
            >
              {siteConfig.cta.heading}
            </h2>
            <p
              className="body-text"
              style={{ textAlign: 'center', marginBottom: 0 }}
            >
              {siteConfig.cta.description}
            </p>

            <CTAForm />

            {/* Proof line */}
            <div className="cta-proof" style={{ marginTop: 16 }}>
              <IconShield />
              {siteConfig.cta.proof}
              <span
                style={{
                  marginLeft: 8,
                  padding: '2px 8px',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-mid)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {siteConfig.cta.proofExtra}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FLOATING SOCIALS
          ================================================================ */}
      <FloatingSocials />

      {/* ================================================================
          STICKY CTA BAR (mobile)
          ================================================================ */}
      <div id="sticky-cta" className="sticky-cta" role="complementary" aria-label="Быстрая связь">
        <div className="ctn">
          <div className="sticky-cta-in">
            <span className="sticky-cta-text">
              {siteConfig.stickyCta}
            </span>
            <div className="sticky-cta-actions">
              <a
                href={telegramHref}
                className="btn-primary"
                style={{
                  background: '#2aabee',
                  fontSize: 13,
                  padding: '10px 16px',
                }}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Написать в Telegram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }} aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.13 13.953l-2.947-.924c-.64-.203-.654-.64.136-.949l11.57-4.461c.537-.194 1.006.131.836.602z" />
                </svg>
                Telegram
              </a>
              <a
                href={whatsappHref}
                className="btn-primary"
                style={{
                  background: '#25d366',
                  fontSize: 13,
                  padding: '10px 16px',
                }}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Написать в WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }} aria-hidden="true">
                  <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L0 24l6.18-1.57A11.96 11.96 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.23-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.23-1.44l-.37-.22-3.67.93.97-3.56-.24-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm5.47-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51H7.5c-.17 0-.45.07-.69.35-.23.27-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.82 2.78 4.4 3.9.62.27 1.1.43 1.47.55.62.2 1.18.17 1.63.1.5-.07 1.53-.62 1.74-1.23.22-.6.22-1.12.15-1.23-.07-.1-.27-.17-.57-.32z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <Footer />
    </>
  );
}
