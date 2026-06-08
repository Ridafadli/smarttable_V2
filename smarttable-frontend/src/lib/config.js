export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_BASE = API_URL.replace(/\/api\/?$/, '');

export const STORAGE_URL = `${API_BASE}/storage`;

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function storageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path.replace(/^\//, '')}`;
}
