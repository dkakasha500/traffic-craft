'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface HomeClientProps {
  children?: ReactNode;
}

/**
 * HomeClient — wraps the home page and mounts all client-side interactivity:
 *  - Nav scroll/hide/scrolled behaviour + nav-cta visibility
 *  - Spotlight card mouse-tracking (--mouse-x / --mouse-y CSS vars)
 *  - Hero dashboard 3-D parallax tilt on mouse move
 *  - IntersectionObserver reveal for [data-reveal] elements (with data-reveal-d stagger)
 *  - IntersectionObserver reveal for .case cards
 *  - IntersectionObserver reveal for [data-principle] / .principle-item elements
 *  - Section active tracking → highlights matching nav links
 *  - Animated border pause when out of viewport
 *  - Stat counter animation (data-count)
 *  - Star animation trigger when reviews section enters viewport
 *  - Pain number reveal with stagger
 *  - ROI glow on case cards when visible
 *  - Sticky CTA bar visibility
 *  - Footer year injection
 *  - Scroll progress bar
 */
export default function HomeClient({ children }: HomeClientProps) {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    /* ─────────────────────────────────────────
       Add .js class to enable CSS observer states
    ───────────────────────────────────────── */
    document.documentElement.classList.add('js');

    /* ─────────────────────────────────────────
       Nav scroll behaviour
    ───────────────────────────────────────── */
    const nav = document.getElementById('main-nav');
    const navCta = document.getElementById('nav-cta-btn');
    let lastScrollY = window.scrollY;

    const handleNavScroll = () => {
      const currentY = window.scrollY;
      if (nav) {
        if (currentY > 60) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
        if (currentY > lastScrollY && currentY > 200) {
          nav.classList.add('nav-hidden');
        } else {
          nav.classList.remove('nav-hidden');
        }
      }
      if (navCta) {
        const heroHeight =
          (document.getElementById('hero') ?? document.querySelector('.hero'))
            ?.getBoundingClientRect().height ?? 400;
        if (currentY > heroHeight * 0.6) {
          navCta.style.opacity = '1';
          navCta.style.pointerEvents = 'auto';
        } else {
          navCta.style.opacity = '0';
          navCta.style.pointerEvents = 'none';
        }
      }
      lastScrollY = currentY;
    };

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    /* ─────────────────────────────────────────
       Sticky CTA bar
    ───────────────────────────────────────── */
    const stickyCta = document.getElementById('sticky-cta');
    const ctaSection = document.getElementById('cta') ?? document.querySelector('.cta-sec');

    const handleStickyScroll = () => {
      if (!stickyCta) return;
      const scrolled = window.scrollY > 600;
      const ctaVisible = ctaSection
        ? ctaSection.getBoundingClientRect().bottom > 0 &&
          ctaSection.getBoundingClientRect().top < window.innerHeight
        : false;
      const isMobile = window.innerWidth < 768;
      if (isMobile && scrolled && !ctaVisible) {
        stickyCta.classList.add('visible');
      } else {
        stickyCta.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    window.addEventListener('resize', handleStickyScroll, { passive: true });
    handleStickyScroll();

    /* ─────────────────────────────────────────
       Spotlight card mouse tracking (--mouse-x / --mouse-y)
    ───────────────────────────────────────── */
    const spotlightCards = document.querySelectorAll<HTMLElement>('.spotlight-card');

    const handleSpotlight = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.spotlight-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
      // Also set legacy vars used in existing CSS
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    };

    spotlightCards.forEach((card) => card.addEventListener('mousemove', handleSpotlight));

    /* ─────────────────────────────────────────
       Hero dashboard 3-D parallax tilt
    ───────────────────────────────────────── */
    const heroDash = document.querySelector<HTMLElement>('.hero-dash-wrap');

    const handleDashParallax = (e: MouseEvent) => {
      if (!heroDash) return;
      const rect = heroDash.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotateX = -dy * 6;
      const rotateY = dx * 6;
      heroDash.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      heroDash.style.transition = 'transform 0.1s ease';
    };

    const handleDashLeave = () => {
      if (!heroDash) return;
      heroDash.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      heroDash.style.transition = 'transform 0.5s ease';
    };

    if (heroDash) {
      document.addEventListener('mousemove', handleDashParallax);
      heroDash.addEventListener('mouseleave', handleDashLeave);
    }

    /* ─────────────────────────────────────────
       IntersectionObserver — generic [data-reveal]
    ───────────────────────────────────────── */
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealD ?? '0';
            el.style.transitionDelay = `${delay}s`;
            el.classList.add('visible');
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.classList.add('reveal-pending');
      revealObserver.observe(el);
    });

    /* ─────────────────────────────────────────
       IntersectionObserver — .case cards
    ───────────────────────────────────────── */
    const caseObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('visible');
            caseObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll('.case').forEach((el) => caseObserver.observe(el));

    /* ─────────────────────────────────────────
       IntersectionObserver — [data-principle] / .principle-item
    ───────────────────────────────────────── */
    const principleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('visible');
            principleObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    document
      .querySelectorAll('[data-principle], .principle-item')
      .forEach((el) => principleObserver.observe(el));

    /* ─────────────────────────────────────────
       Section active tracking
    ───────────────────────────────────────── */
    const sections = document.querySelectorAll<HTMLElement>('section[id], .sec[id]');
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]');

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).id;
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              if (href === `#${id}`) {
                link.classList.add('active');
                link.style.color = 'var(--accent)';
              } else {
                link.classList.remove('active');
                link.style.color = '';
              }
            });
          }
        });
      },
      { threshold: 0.4, rootMargin: '-20% 0px -20% 0px' },
    );

    sections.forEach((sec) => sectionObserver.observe(sec));

    /* ─────────────────────────────────────────
       Animated border pause when out of viewport
    ───────────────────────────────────────── */
    const animatedBorders = document.querySelectorAll<HTMLElement>('.animated-border');

    const borderObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          el.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        });
      },
      { threshold: 0 },
    );

    animatedBorders.forEach((el) => borderObserver.observe(el));

    /* ─────────────────────────────────────────
       Stat counter animation (data-count)
    ───────────────────────────────────────── */
    const statEls = document.querySelectorAll<HTMLElement>('[data-count]');

    const animateCount = (el: HTMLElement) => {
      const raw = el.dataset.count ?? '0';
      // Extract numeric part and suffix (e.g. "95%" → 95, "%")
      const match = raw.match(/^([\d.]+)(.*)$/);
      if (!match) return;
      const target = parseFloat(match[1]);
      const suffix = match[2] ?? '';
      const isFloat = match[1].includes('.');
      const decimals = isFloat ? (match[1].split('.')[1]?.length ?? 0) : 0;
      const duration = 1800;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = `${current.toFixed(decimals)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target as HTMLElement);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    statEls.forEach((el) => counterObserver.observe(el));

    /* ─────────────────────────────────────────
       Star animation — trigger when reviews section enters viewport
    ───────────────────────────────────────── */
    const reviewsSection =
      document.getElementById('reviews') ?? document.querySelector('.reviews-sec');

    const starsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Restart star animations by toggling a class
            entry.target.querySelectorAll<HTMLElement>('.review-star').forEach((star, i) => {
              star.style.animationDelay = `${i * 0.05}s`;
              // Force reflow to restart animation
              void star.offsetWidth;
              star.style.animation = 'none';
              void star.offsetWidth;
              star.style.animation = '';
            });
            starsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (reviewsSection) starsObserver.observe(reviewsSection);

    /* ─────────────────────────────────────────
       Pain / problem number reveal with stagger
    ───────────────────────────────────────── */
    const problemNums = document.querySelectorAll<HTMLElement>('.problem-num');

    const painObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = Array.from(problemNums).indexOf(el);
            setTimeout(() => {
              el.classList.add('revealed');
              el.style.opacity = '1';
              el.style.transform = 'translateX(0)';
            }, idx * 120);
            painObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.3 },
    );

    problemNums.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-10px)';
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      painObserver.observe(el);
    });

    /* ─────────────────────────────────────────
       ROI glow — add .glow class to .case-roi elements when visible
    ───────────────────────────────────────── */
    const roiEls = document.querySelectorAll<HTMLElement>('.case-roi');

    const roiObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('glow');
            roiObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    roiEls.forEach((el) => roiObserver.observe(el));

    /* ─────────────────────────────────────────
       Footer year
    ───────────────────────────────────────── */
    const yearEls = document.querySelectorAll<HTMLElement>('[data-year], .footer-year, #footer-year');
    const currentYear = new Date().getFullYear().toString();
    yearEls.forEach((el) => {
      el.textContent = currentYear;
    });

    /* ─────────────────────────────────────────
       Cleanup
    ───────────────────────────────────────── */
    return () => {
      window.removeEventListener('scroll', handleNavScroll);
      window.removeEventListener('scroll', handleStickyScroll);
      window.removeEventListener('resize', handleStickyScroll);
      if (heroDash) {
        document.removeEventListener('mousemove', handleDashParallax);
        heroDash.removeEventListener('mouseleave', handleDashLeave);
      }
      spotlightCards.forEach((card) => card.removeEventListener('mousemove', handleSpotlight));
      revealObserver.disconnect();
      caseObserver.disconnect();
      principleObserver.disconnect();
      sectionObserver.disconnect();
      borderObserver.disconnect();
      counterObserver.disconnect();
      starsObserver.disconnect();
      painObserver.disconnect();
      roiObserver.disconnect();
    };
  }, []);

  return <>{children}</>;
}
