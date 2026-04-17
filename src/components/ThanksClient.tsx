'use client';

import { useEffect, useRef } from 'react';

/**
 * ThanksClient — mounts client-side interactivity for the thank-you page:
 *  - Footer year injection
 */
export default function ThanksClient() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    /* ─────────────────────────────────────────
       Footer year
    ───────────────────────────────────────── */
    const yearEls = document.querySelectorAll<HTMLElement>(
      '[data-year], .footer-year, #footer-year',
    );
    const currentYear = new Date().getFullYear().toString();
    yearEls.forEach((el) => {
      el.textContent = currentYear;
    });
  }, []);

  return null;
}
