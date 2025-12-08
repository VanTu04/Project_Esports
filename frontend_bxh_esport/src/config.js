const resolveBase = () => {
  // Prefer explicit Vite env override during dev/build
  try {
    const fromEnv = import.meta.env?.VITE_API_BASE_URL;
    if (fromEnv) return fromEnv;
  } catch (e) {}

  // Fallback to current origin + /api when running in browser
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }

  // Final fallback: keep existing remote as last resort
  return 'http://183.81.33.178:8081/api';
};

export const API_CONFIG = {
  baseURL: resolveBase(),
  timeout: 30000,
};
