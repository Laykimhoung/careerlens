/**
 * Centralized feature flags for the CareerLens frontend application.
 *
 * Feature flags are driven by Vite compile-time environment variables (VITE_*).
 * Note: Vite replaces `import.meta.env.*` expressions statically at build time.
 * Never place private keys or backend credentials in client-side feature flags.
 */

const rawDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE;

/**
 * Returns whether Demo Mode features (Dashboard Role Switcher, Quick Demo Login,
 * and demo-related controls) are enabled for the current environment.
 *
 * Defaults to `false` (disabled) unless explicitly configured as "true" or "1".
 *
 * @returns {boolean}
 */
export const isDemoModeEnabled = () => {
  if (typeof rawDemoMode === "boolean") {
    return rawDemoMode;
  }
  if (!rawDemoMode) {
    return false;
  }
  const normalized = String(rawDemoMode).trim().toLowerCase();
  return normalized === "true" || normalized === "1";
};

export const ENABLE_DEMO_MODE = isDemoModeEnabled();

