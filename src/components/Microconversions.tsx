'use client';

import { useEffect, useRef } from 'react';

interface MicroconversionsProps {
  page: string;
  pixelId: string;
}

/* ── helpers ── */

/**
 * Safe wrapper — calls window.fbq if available.
 * Falls back to _fbqQueue so events aren't lost if the SDK isn't loaded yet.
 */
function fbq(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq === 'function') {
    window.fbq(...args);
  } else {
    /* Queue for MetaPixel to drain once the stub is created */
    const q = (window as unknown as { _fbqQueue?: unknown[][] })._fbqQueue ?? [];
    q.push(args);
    (window as unknown as { _fbqQueue: unknown[][] })._fbqQueue = q;
  }
}

/** Read a cookie value by name */
function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/** Compute fbp value following Facebook's spec */
function computeFbp(): string {
  const existing = getCookie('_fbp');
  if (existing) return existing;
  const rand = Math.floor(Math.random() * 2 ** 31);
  const ts = Math.floor(Date.now() / 1000);
  const value = `fb.1.${ts}.${rand}`;
  document.cookie = `_fbp=${value}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
  return value;
}

/** Extract fbc from URL fbclid param or existing cookie */
function computeFbc(): string {
  const existing = getCookie('_fbc');
  if (existing) return existing;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');
  if (!fbclid) return '';
  const ts = Math.floor(Date.now() / 1000);
  const value = `fb.1.${ts}.${fbclid}`;
  document.cookie = `_fbc=${value}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  return value;
}

function getEngagementBase() {
  return {
    fbc: getCookie('_fbc'),
    fbp: getCookie('_fbp'),
  };
}

export default function Microconversions({ page, pixelId }: MicroconversionsProps) {
  const formStarted = useRef(false);
  const formSubmitted = useRef(false);
  const engagementScore = useRef(0);

  /* Increment engagement and send if threshold crossed */
  function addEngagement(points: number, reason: string) {
    engagementScore.current += points;
    fbq('trackCustom', 'EngagementScore', {
      page,
      reason,
      score: engagementScore.current,
      ...getEngagementBase(),
    });
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* ── Bootstrap cookies ── */
    computeFbp();
    computeFbc();

    /* ── Returning Visitor ── */
    let visits = 1;
    try {
      const visitKey = `tc_visits_${page}`;
      visits = parseInt(localStorage.getItem(visitKey) ?? '0', 10) + 1;
      localStorage.setItem(visitKey, String(visits));
    } catch {
      /* localStorage may be unavailable in some contexts */
    }
    if (visits > 1) {
      fbq('trackCustom', 'ReturningVisitor', {
        page,
        visits,
        pixelId,
        ...getEngagementBase(),
      });
      addEngagement(20, 'returning_visitor');
    }

    /* ── ContentView — IntersectionObserver on sections ── */
    const contentViewedSections = new Set<string>();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = (entry.target as HTMLElement).id || entry.target.tagName;
          if (contentViewedSections.has(id)) return;
          contentViewedSections.add(id);
          fbq('trackCustom', 'ContentView', {
            page,
            section: id,
            ...getEngagementBase(),
          });
          addEngagement(5, `content_view_${id}`);
        });
      },
      { threshold: 0.4 },
    );
    document.querySelectorAll('section[id], [data-section]').forEach((el) => {
      sectionObserver.observe(el);
    });

    /* ── ViewCTA — IntersectionObserver on #cta ── */
    let ctaViewed = false;
    const ctaEl = document.getElementById('cta');
    let ctaObserver: IntersectionObserver | null = null;
    if (ctaEl) {
      ctaObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !ctaViewed) {
            ctaViewed = true;
            fbq('trackCustom', 'ViewCTA', { page, ...getEngagementBase() });
            addEngagement(15, 'view_cta');
          }
        },
        { threshold: 0.5 },
      );
      ctaObserver.observe(ctaEl);
    }

    /* ── TimeOnPage ── */
    let t30done = false;
    let t60done = false;
    let hidden = false;
    let elapsed = 0;
    let lastTick = Date.now();

    const tickInterval = setInterval(() => {
      if (!hidden) {
        elapsed += Date.now() - lastTick;
      }
      lastTick = Date.now();

      if (!t30done && elapsed >= 30_000) {
        t30done = true;
        fbq('trackCustom', 'TimeOnPage30', { page, ...getEngagementBase() });
        addEngagement(10, 'time_30s');
      }
      if (!t60done && elapsed >= 60_000) {
        t60done = true;
        fbq('trackCustom', 'TimeOnPage60', { page, ...getEngagementBase() });
        addEngagement(15, 'time_60s');
        clearInterval(tickInterval);
      }
    }, 1_000);

    const handleVisibilityChange = () => {
      hidden = document.hidden;
      lastTick = Date.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    /* ── ScrollDepth ── */
    const scrollMilestones = [25, 50, 75, 100];
    const reachedMilestones = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of scrollMilestones) {
        if (pct >= milestone && !reachedMilestones.has(milestone)) {
          reachedMilestones.add(milestone);
          fbq('trackCustom', 'ScrollDepth', {
            page,
            depth: milestone,
            ...getEngagementBase(),
          });
          addEngagement(milestone === 100 ? 20 : 10, `scroll_${milestone}`);
        }
      }
    };

    /* Only track scroll on pages that actually scroll */
    const isScrollable =
      document.documentElement.scrollHeight > window.innerHeight + 50;
    if (isScrollable) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /* ── FormStart ── */
    const handleFormFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !formStarted.current
      ) {
        formStarted.current = true;
        fbq('trackCustom', 'FormStart', { page, ...getEngagementBase() });
        addEngagement(10, 'form_start');
      }
    };
    document.addEventListener('focusin', handleFormFocus);

    /* ── FormAbandonment ── */
    const handleBeforeUnload = () => {
      if (formStarted.current && !formSubmitted.current) {
        fbq('trackCustom', 'FormAbandonment', { page, ...getEngagementBase() });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    /* ── MessengerClick — WhatsApp / Telegram ── */
    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.href ?? '';
      if (href.includes('wa.me') || href.includes('whatsapp')) {
        fbq('trackCustom', 'MessengerClick', {
          page,
          messenger: 'whatsapp',
          ...getEngagementBase(),
        });
        addEngagement(25, 'whatsapp_click');
      } else if (href.includes('t.me') || href.includes('telegram')) {
        fbq('trackCustom', 'MessengerClick', {
          page,
          messenger: 'telegram',
          ...getEngagementBase(),
        });
        addEngagement(25, 'telegram_click');
      }
    };
    document.addEventListener('click', handleLinkClick);

    /* ── RageClick ── */
    const clickTimes: number[] = [];
    const RAGE_THRESHOLD_MS = 700;
    const RAGE_CLICK_COUNT = 3;
    let rageFired = false;

    const handleRageClick = (e: MouseEvent) => {
      const now = Date.now();
      clickTimes.push(now);
      // Keep only recent clicks
      while (clickTimes.length && now - clickTimes[0] > RAGE_THRESHOLD_MS * RAGE_CLICK_COUNT) {
        clickTimes.shift();
      }
      if (!rageFired && clickTimes.length >= RAGE_CLICK_COUNT) {
        rageFired = true;
        const el = e.target as HTMLElement;
        fbq('trackCustom', 'RageClick', {
          page,
          element: el.tagName,
          id: el.id || undefined,
          className: el.className || undefined,
          ...getEngagementBase(),
        });
      }
    };
    document.addEventListener('click', handleRageClick);

    /* ── ExitIntent ── */
    let exitFired = false;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitFired) {
        exitFired = true;
        fbq('trackCustom', 'ExitIntent', { page, ...getEngagementBase() });
        addEngagement(5, 'exit_intent');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    /* ── Cleanup ── */
    return () => {
      clearInterval(tickInterval);
      sectionObserver.disconnect();
      ctaObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focusin', handleFormFocus);
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('click', handleRageClick);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isScrollable) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pixelId]);

  /* Expose formSubmitted setter for CTAForm to call */
  useEffect(() => {
    /* If CTAForm already set the boolean before this effect ran, pick it up */
    if (window.__tcFormSubmitted === true) {
      formSubmitted.current = true;
    }
    /* Install the callback for future calls */
    (
      window as unknown as { __tcFormSubmitted?: boolean | (() => void) }
    ).__tcFormSubmitted = () => {
      formSubmitted.current = true;
    };
    return () => {
      delete (window as unknown as { __tcFormSubmitted?: boolean | (() => void) })
        .__tcFormSubmitted;
    };
  }, []);

  return null;
}
