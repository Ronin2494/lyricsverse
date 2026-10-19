// Admin API client: keep the access key in memory, never browser storage.
export const ADMIN_API = 'https://lyricsverse-api.onrender.com';

export function adminErrorMessage(code) {
  switch (code) {
    case 'invalid_admin_key':
      return 'The admin key was not accepted. Confirm it matches ADMIN_API_KEY in the LyricVerse API service on Render.';
    case 'admin_key_not_configured':
      return 'Admin login is not configured on the API. Add a strong ADMIN_API_KEY (at least 24 characters) to the LyricVerse API service in Render.';
    case 'origin_not_allowed':
      return 'This page is not authorized to access the admin API. Open the official LyricVerse admin page.';
    case 'admin_connection_failed':
      return 'The admin API could not be reached. Check your connection or try again after the API wakes up.';
    case 'admin_request_timeout':
      return 'The admin API took too long to respond. Please try again.';
    case 'database_unavailable':
      return 'The key worked, but the lyrics database is temporarily unavailable.';
    default:
      return 'Admin request failed. Please try again.';
  }
}

export function createAdminClient({
  apiBase = ADMIN_API,
  fetcher = fetch,
  timeout = 20000
} = {}) {
  let key = '';
  return {
    setKey(value) { key = String(value || '').trim(); },
    clearKey() { key = ''; },
    hasKey() { return Boolean(key); },
    async request(method = 'GET', body, path = '/api/v1/admin/lyrics') {
      if (!key) throw new Error('invalid_admin_key');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      let response;
      try {
        response = await fetcher(apiBase + path, {
          method,
          headers: {
            Authorization: 'Bearer ' + key,
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: controller.signal,
          cache: 'no-store'
        });
      } catch (error) {
        throw new Error(controller.signal.aborted ? 'admin_request_timeout' : 'admin_connection_failed');
      } finally {
        clearTimeout(timer);
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error :
          response.status === 401 ? 'invalid_admin_key' :
          response.status === 503 ? 'admin_key_not_configured' :
          response.status === 403 ? 'origin_not_allowed' : 'admin_request_failed');
      }
      return data;
    }
  };
}
