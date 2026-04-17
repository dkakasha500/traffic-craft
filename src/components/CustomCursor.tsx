'use client';

import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTORS =
  'a, button, input, textarea, select, label, [role="button"], [tabindex]:not([tabindex="-1"])';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* Only activate on devices with a precise pointer (mouse/trackpad) */
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = dotRef.current;
    const outline = outlineRef.current;
    if (!dot || !outline) return;

    /* Signal to global styles that the custom cursor is active */
    document.documentElement.classList.add('js-cursor');

    let mouseX = -100;
    let mouseY = -100;
    let outlineX = -100;
    let outlineY = -100;
    let rafId = 0;
    let visible = false;

    const show = () => {
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        outline.style.opacity = '1';
      }
    };

    const hide = () => {
      if (visible) {
        visible = false;
        dot.style.opacity = '0';
        outline.style.opacity = '0';
      }
    };

    /* RAF loop — smooth outline follows dot with slight lag */
    const loop = () => {
      outlineX += (mouseX - outlineX) * 0.18;
      outlineY += (mouseY - outlineY) * 0.18;

      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      outline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    /* Track position */
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      show();
    };

    /* Hover state on interactive elements */
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTORS)) {
        dot.classList.add('cursor-dot--hover');
        outline.classList.add('cursor-outline--hover');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTORS)) {
        dot.classList.remove('cursor-dot--hover');
        outline.classList.remove('cursor-outline--hover');
      }
    };

    /* Hide when pointer leaves document or window loses focus */
    const handleDocLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    const handleBlur = () => hide();

    const handleVisibilityChange = () => {
      if (document.hidden) hide();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mouseleave', handleDocLeave);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('js-cursor');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mouseleave', handleDocLeave);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        aria-hidden="true"
        style={{ opacity: 0 }}
      />
      <div
        ref={outlineRef}
        className="cursor-outline"
        aria-hidden="true"
        style={{ opacity: 0 }}
      />
    </>
  );
}
