'use client';

import { useEffect } from 'react';

/* Global Window types in src/types/global.d.ts */

interface MetaPixelProps {
  pixelId: string;
  event?: string;
  eventData?: Record<string, unknown>;
}

/**
 * Fire an arbitrary fbq event from client code after the Pixel SDK has loaded.
 * Safe to call at any point — queues gracefully if fbq is not yet available.
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, eventData ?? {});
  } else {
    // Enqueue for after SDK load
    const existing =
      (window as unknown as { _fbqQueue?: Array<unknown[]> })._fbqQueue ?? [];
    existing.push(['track', eventName, eventData ?? {}]);
    (window as unknown as { _fbqQueue: Array<unknown[]> })._fbqQueue = existing;
  }
}

export default function MetaPixel({ pixelId, event, eventData }: MetaPixelProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* Prevent double-initialisation */
    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      if (event) {
        window.fbq('track', event, eventData ?? {});
      } else {
        window.fbq('track', 'PageView');
      }
      return;
    }

    /* Inject the Facebook Pixel base code */
    const n: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[][];
      push: (...args: unknown[]) => void;
      loaded: boolean;
      version: string;
    } = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    } as typeof n;

    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    window.fbq = n;

    /* Drain any queued events from trackEvent() */
    const queued =
      (window as unknown as { _fbqQueue?: Array<unknown[]> })._fbqQueue ?? [];
    queued.forEach((args) => window.fbq(...args));
    delete (window as unknown as { _fbqQueue?: Array<unknown[]> })._fbqQueue;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onload = () => {
      window.fbq('init', pixelId);
      if (event) {
        window.fbq('track', event, eventData ?? {});
      } else {
        window.fbq('track', 'PageView');
      }
    };
    document.head.appendChild(script);
  }, [pixelId, event, eventData]);

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
