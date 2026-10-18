/**
 * Unified API Configuration
 * Single-port architecture for Next.js (port 3000).
 * In browser: returns '' so all requests are relative to current origin.
 * In SSR / Node: returns INTERNAL_API_URL or defaults to http://127.0.0.1:3000.
 */
export const getApiHost = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
};

export default getApiHost;

