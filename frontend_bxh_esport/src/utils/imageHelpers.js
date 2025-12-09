import { API_URL } from './constants';

/**
 * Build full URL from relative path
 * Backend returns paths like: /uploads/xxx.png
 * This function converts to: http://localhost:8081/uploads/xxx.png
 */
export function normalizeImageUrl(url) {
  if (!url) return null;
  const path = String(url).trim();
  if (!path) return null;
  
  // Already absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Relative path - prepend backend URL (API_URL for images, not API_BASE_URL)
  const backend = API_URL || '';
  return `${backend}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Resolve team logo from various possible field names
 */
export function resolveTeamLogo(team) {
  if (!team) return null;
  // Support multiple shapes: logo_url, logo, avatar, nested team.avatar
  const path = team.logo_url ?? team.logo ?? team.avatar ?? team?.team?.avatar ?? team.image ?? team.team_logo ?? team.logoUrl ?? null;
  return normalizeImageUrl(path);
}

export default { normalizeImageUrl, resolveTeamLogo };
