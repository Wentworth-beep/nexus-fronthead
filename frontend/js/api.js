window.API = {
  async request(path, { method = 'GET', body, headers = {} } = {}) {
    const isFormData = body instanceof FormData;
    const localApiUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://localhost:5000'
      : '';
    const baseUrl = (window.NEXUS_API_URL || localApiUrl).replace(/\/$/, '');
    const url = /^https?:\/\//i.test(path) ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined
        ? isFormData || typeof body === 'string'
          ? body
          : JSON.stringify(body)
        : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(
        new Error(data.error || data.errors?.[0]?.msg || `HTTP ${res.status}`),
        { status: res.status, data },
      );
    }
    return data;
  },
  get: (path) => window.API.request(path),
  post: (path, body) => window.API.request(path, { method: 'POST', body }),
  put: (path, body) => window.API.request(path, { method: 'PUT', body }),
  patch: (path, body) => window.API.request(path, { method: 'PATCH', body }),
  del: (path) => window.API.request(path, { method: 'DELETE' }),
};
