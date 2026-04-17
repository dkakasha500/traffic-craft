'use client';

import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return (
    <div
      className="scroll-progress-track"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        ref={barRef}
        className="scroll-progress-bar"
        style={{
          height: '100%',
          width: '0%',
          background: 'linear-gradient(90deg, #0ee0cf 0%, #3b82f6 100%)',
          transition: 'width 0.1s linear',
          willChange: 'width',
        }}
      />
    </div>
  );
}
