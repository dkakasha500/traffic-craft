/* ============================================================
   Global type augmentations — single source of truth for
   window properties used across the app.
   ============================================================ */

export {};

declare global {
  interface Window {
    /** Meta Pixel SDK */
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;

    /**
     * Bridge between CTAForm (sets) and Microconversions (reads).
     * Can be a callback (installed by Microconversions) or a boolean
     * (set by CTAForm after submission).
     */
    __tcFormSubmitted?: boolean | (() => void);
  }
}
