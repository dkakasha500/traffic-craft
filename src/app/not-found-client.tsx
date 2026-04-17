'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/components/MetaPixel';
import { siteConfig } from '@/lib/site.config';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  color: string;
}

interface CodeColumn {
  id: number;
  x: number;
  chars: string[];
  speed: number;
  opacity: number;
}

const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ∑∏∂∇∈∉⊂⊃∪∩∀∃';

function randomChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

export default function NotFoundClient() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [columns, setColumns] = useState<CodeColumn[]>([]);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });

  /* Generate particles and columns on mount */
  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      speedX: (Math.random() - 0.5) * 0.03,
      speedY: (Math.random() - 0.5) * 0.03,
      color: Math.random() > 0.7 ? '#0ee0cf' : Math.random() > 0.5 ? '#3b82f6' : '#ffffff',
    }));
    setParticles(newParticles);

    const cols = Math.floor(window.innerWidth / 28);
    const newColumns: CodeColumn[] = Array.from({ length: cols }, (_, i) => ({
      id: i,
      x: i * 28,
      chars: Array.from({ length: 20 }, () => randomChar()),
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.15 + 0.02,
    }));
    setColumns(newColumns);

    /* Fire View404 custom event */
    trackEvent('View404', { page: '404', path: window.location.pathname });
  }, []);

  /* Animate particles */
  useEffect(() => {
    if (particles.length === 0) return;

    let frame: number;
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let x = p.x + p.speedX;
          let y = p.y + p.speedY;
          let speedX = p.speedX;
          let speedY = p.speedY;
          if (x < 0 || x > 100) speedX = -speedX;
          if (y < 0 || y > 100) speedY = -speedY;
          x = Math.max(0, Math.min(100, x));
          y = Math.max(0, Math.min(100, y));
          return { ...p, x, y, speedX, speedY };
        }),
      );
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [particles.length]);

  /* Animate matrix chars */
  useEffect(() => {
    if (columns.length === 0) return;
    const interval = setInterval(() => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          chars: col.chars.map((c, i) =>
            i === Math.floor(Math.random() * col.chars.length) ? randomChar() : c,
          ),
        })),
      );
    }, 80);
    return () => clearInterval(interval);
  }, [columns.length]);

  /* Mouse spotlight */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="not-found-scene"
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Grid background */}
      <div
        className="grid-bg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(14,224,207,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,224,207,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Radial glow */}
      <div
        className="glow"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(14,224,207,0.08) 0%, transparent 70%)',
          animation: 'glowPulse 4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Code rain columns */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              position: 'absolute',
              left: col.x,
              top: 0,
              width: '20px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#0ee0cf',
              opacity: col.opacity,
              lineHeight: '28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {col.chars.map((char, j) => (
              <span
                key={j}
                style={{
                  opacity: j === 0 ? 1 : 1 - j * 0.05,
                  color: j === 0 ? '#fff' : '#0ee0cf',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Floating particles */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              opacity: p.opacity,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* Mouse spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14,224,207,0.06) 0%, transparent 70%)`,
          transition: 'background 0.05s',
        }}
      />

      {/* Content card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '60px 48px',
          maxWidth: '560px',
          width: '100%',
          margin: '0 24px',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(14,224,207,0.15)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}
      >
        {/* Scan line */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(14,224,207,0.4), transparent)',
            animation: 'scanLine 3s linear infinite',
            top: 0,
          }}
        />

        {/* Orbit dots */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#0ee0cf',
              animation: `orbit${i + 1} ${4 + i}s linear infinite`,
              opacity: 0.6,
            }}
          />
        ))}

        {/* Glitch 404 */}
        <div
          style={{
            fontSize: 'clamp(80px, 18vw, 160px)',
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: '16px',
            position: 'relative',
            color: '#f4f4f5',
            letterSpacing: '-4px',
          }}
        >
          <span className="glitch-text" data-text="404" style={{ position: 'relative' }}>
            <span style={{
              background: 'linear-gradient(135deg, #0ee0cf 0%, #3b82f6 50%, #f4f4f5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              404
            </span>
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            fontWeight: 700,
            color: '#f4f4f5',
            marginBottom: '12px',
          }}
        >
          {siteConfig.notFound.heading}
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#71717a',
            lineHeight: 1.6,
            marginBottom: '36px',
          }}
        >
          {siteConfig.notFound.description}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #0ee0cf 0%, #0ab8aa 100%)',
              color: '#000',
              fontWeight: 700,
              fontSize: '14px',
              padding: '12px 28px',
              borderRadius: '100px',
              textDecoration: 'none',
            }}
          >
            {siteConfig.notFound.homeLink}
          </Link>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#a1a1aa',
              fontWeight: 600,
              fontSize: '14px',
              padding: '12px 28px',
              borderRadius: '100px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {siteConfig.notFound.backLink}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes scanLine {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes orbit1 {
          0% { transform: translate(240px, 0px); }
          25% { transform: translate(0px, -120px); }
          50% { transform: translate(-240px, 0px); }
          75% { transform: translate(0px, 120px); }
          100% { transform: translate(240px, 0px); }
        }
        @keyframes orbit2 {
          0% { transform: translate(-220px, 0px); }
          25% { transform: translate(0px, 110px); }
          50% { transform: translate(220px, 0px); }
          75% { transform: translate(0px, -110px); }
          100% { transform: translate(-220px, 0px); }
        }
        @keyframes orbit3 {
          0% { transform: translate(0px, -130px); }
          25% { transform: translate(260px, 0px); }
          50% { transform: translate(0px, 130px); }
          75% { transform: translate(-260px, 0px); }
          100% { transform: translate(0px, -130px); }
        }
        @keyframes orbit4 {
          0% { transform: translate(0px, 140px); }
          25% { transform: translate(-280px, 0px); }
          50% { transform: translate(0px, -140px); }
          75% { transform: translate(280px, 0px); }
          100% { transform: translate(0px, 140px); }
        }
      `}</style>
    </div>
  );
}
