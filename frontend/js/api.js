// LAYER: Frontend API client — single fetch wrapper
// Nothing else in frontend/ may call fetch() directly.

window.API = {
  async request(path, { method = 'GET', body, headers = {} } = {}) {
    const isFormData = body instanceof FormData;
    const opts = {
      method,
      credentials: 'include',
      headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
    };
    if (body !== undefined && isFormData) {
      opts.body = body;
    } else if (body !== undefined) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const res = await fetch(path, opts);
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON body */ }

    if (!res.ok) {
      const msg =
        data.error ||
        data.errors?.[0]?.msg ||
        `HTTP ${res.status}`;
      throw Object.assign(new Error(msg), { status: res.status, data });
    }
    return data;
  },

  get:   (p)       => API.request(p),
  post:  (p, b)    => API.request(p, { method: 'POST',   body: b }),
  put:   (p, b)    => API.request(p, { method: 'PUT',    body: b }),
  patch: (p, b)    => API.request(p, { method: 'PATCH',  body: b }),
  del:   (p)       => API.request(p, { method: 'DELETE' }),
};