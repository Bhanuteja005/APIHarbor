// akhilmhdh: These are runtime environment variables loaded from server
// The window body is filled with value from the server
// We add a script in index.html to load it from server before react loads
/* eslint-disable no-underscore-dangle */
export const envConfig = {
  ENV: import.meta.env.MODE,
  // Base URL of the backend API. Empty by default → the SPA calls the API on
  // its own origin (the single-image STANDALONE_MODE deploy, and the dev proxy).
  // Set VITE_API_URL when the frontend is served from a different origin than
  // the backend (e.g. a standalone frontend service), pointing at the API host.
  get API_URL() {
    return window?.__INFISICAL_RUNTIME_ENV__?.API_URL || import.meta.env.VITE_API_URL || "";
  },
  get CAPTCHA_SITE_KEY() {
    return (
      window?.__INFISICAL_RUNTIME_ENV__?.CAPTCHA_SITE_KEY || import.meta.env.VITE_CAPTCHA_SITE_KEY
    );
  },
  get INTERCOM_ID() {
    return window?.__INFISICAL_RUNTIME_ENV__?.INTERCOM_ID || import.meta.env.VITE_INTERCOM_ID;
  },
  get POSTHOG_API_KEY() {
    return (
      window?.__INFISICAL_RUNTIME_ENV__?.POSTHOG_API_KEY || import.meta.env.VITE_POSTHOG_API_KEY
    );
  },
  get POSTHOG_HOST() {
    return import.meta.env.VITE_POSTHOG_HOST! || "https://app.posthog.com";
  },
  get TELEMETRY_CAPTURING_ENABLED() {
    return (
      window?.__INFISICAL_RUNTIME_ENV__?.TELEMETRY_CAPTURING_ENABLED ||
      import.meta.env.VITE_TELEMETRY_CAPTURING_ENABLED === true
    );
  },

  get PLATFORM_VERSION() {
    // Release tags (e.g. "v0.159.15") are passed through as INFISICAL_PLATFORM_VERSION
    // by the release workflow. Strip any leading "v" so consumers can prefix it
    // themselves without producing "vv0.159.15".
    return import.meta.env.VITE_INFISICAL_PLATFORM_VERSION?.replace(/^v/i, "");
  }
};
