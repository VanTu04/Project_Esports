import { API_BACKEND, API_BASE_URL } from '../utils/constants';

function getBackendBase() {
  // Priority: explicit window var -> VITE_API_BACKEND / API_BACKEND -> absolute API_BASE_URL -> empty
  if (typeof window !== 'undefined' && window.__BACKEND_URL__) return window.__BACKEND_URL__;
  // Access `import.meta` inside try/catch — some bundlers/environments may not support `typeof import` checks.
  try {
    const metaEnv = (typeof import.meta !== 'undefined') ? import.meta.env : undefined;
    if (metaEnv && (metaEnv.VITE_API_BACKEND || metaEnv.VITE_BACKEND_URL)) {
      return metaEnv.VITE_API_BACKEND || metaEnv.VITE_BACKEND_URL;
    }
  } catch (e) {
    // ignore: not all runtimes expose import.meta
  }
  if (API_BACKEND) return API_BACKEND;
  if (API_BASE_URL && /^https?:\/\//i.test(API_BASE_URL)) return API_BASE_URL;
  return '';
}

export function normalizeImageUrl(url) {
  if (!url) return null;
  let s = String(url).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const backend = getBackendBase();
  if (backend) return `${backend.replace(/\/$/, '')}${s.startsWith('/') ? s : `/${s}`}`;
  return s;
}

export function resolveTeamLogo(team) {
  if (!team) return null;
  // support multiple shapes: participant.logo_url, team.avatar, nested `team.team.avatar` (from backend include)
  const url = team.logo_url ?? team.logo ?? team.avatar ?? team?.team?.avatar ?? team.image ?? team.team_logo ?? team.logoUrl ?? null;
  return normalizeImageUrl(url);
}

export default { normalizeImageUrl, resolveTeamLogo };
