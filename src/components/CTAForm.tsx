'use client';

import { FormEvent, useRef, useState } from 'react';
import { siteConfig } from '@/lib/site.config';
import { trackEvent } from '@/components/MetaPixel';

/* ── UTM / fbclid helpers ── */

function getUrlParam(name: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) ?? '';
}

function getUtmParams(): Record<string, string> {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const params: Record<string, string> = {};
  for (const key of keys) {
    const val = getUrlParam(key);
    if (val) params[key] = val;
  }
  return params;
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/* ── Component ── */

export default function CTAForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    /* Basic validation */
    const trimName = name.trim();
    const trimPhone = phone.trim();
    const trimProject = project.trim();
    if (trimName.length < 2 || !trimPhone) return;

    setLoading(true);

    /* Mark as submitted (prevents FormAbandonment in Microconversions) */
    if (typeof window !== 'undefined') {
      if (typeof window.__tcFormSubmitted === 'function') {
        window.__tcFormSubmitted();
      }
      window.__tcFormSubmitted = true;
    }

    const fbclid = getUrlParam('fbclid');
    const utmParams = getUtmParams();
    const fbc = getCookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '');

    const payload = {
      name: trimName,
      phone: trimPhone,
      project: trimProject,
      fbclid,
      fbc,
      ...utmParams,
    };

    /* Send to API route (non-blocking) */
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      /* continue to fire pixel & redirect even on API error */
    }

    /* Fire fbq Lead event with advanced matching */
    const phoneClean = trimPhone.replace(/[^0-9]/g, '');
    const leadData: Record<string, unknown> = {
      content_name: trimProject || siteConfig.form.fallbackProject,
      content_category: 'form_submit',
      value: 0,
      currency: 'KZT',
    };
    if (trimName) leadData.fn = trimName.toLowerCase();
    if (phoneClean.length >= 7) leadData.ph = phoneClean;
    if (fbc) leadData.fbc = fbc;
    Object.entries(utmParams).forEach(([k, v]) => {
      leadData[k] = v;
    });
    trackEvent('Lead', leadData);

    /* Build WhatsApp message and redirect */
    const projectPart = trimProject ? ` ${siteConfig.form.projectPrefix}: ${trimProject}.` : '';
    let msg = siteConfig.form.waMessageTemplate
      .replace('{name}', trimName)
      .replace('{phone}', trimPhone)
      .replace('{project}', projectPart);
    if (fbclid) msg += ` [fbclid:${fbclid}]`;

    const waUrl = `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(msg)}`;

    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }, 600);
  };

  return (
    <form ref={formRef} className="cta-form" id="ctaForm" onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <div className="cta-field">
        <input
          id="ctaName"
          className="cta-input"
          type="text"
          placeholder=" "
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoCapitalize="words"
          autoComplete="name"
          aria-label={siteConfig.form.nameLabel}
        />
        <label htmlFor="ctaName" className="cta-label">
          {siteConfig.form.nameLabel}
        </label>
      </div>

      {/* Phone / Telegram */}
      <div className="cta-field">
        <input
          id="ctaPhone"
          className="cta-input"
          type="tel"
          placeholder=" "
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="tel"
          autoComplete="tel"
          aria-label={siteConfig.form.phoneLabel}
          pattern="[0-9+@a-zA-Z_\-\s]{3,}"
        />
        <label htmlFor="ctaPhone" className="cta-label">
          {siteConfig.form.phoneLabel}
        </label>
      </div>

      {/* Project (optional) */}
      <div className="cta-field" style={{ width: '100%' }}>
        <input
          id="ctaProject"
          className="cta-input"
          type="text"
          placeholder=" "
          value={project}
          onChange={(e) => setProject(e.target.value)}
          autoComplete="off"
          aria-label={siteConfig.form.projectLabel}
        />
        <label htmlFor="ctaProject" className="cta-label">
          {siteConfig.form.projectLabel}
        </label>
      </div>

      <button type="submit" className="btn-white" id="ctaSubmitBtn" disabled={loading}>
        {loading ? siteConfig.ui.loadingText : siteConfig.cta.submitText}
      </button>
    </form>
  );
}
