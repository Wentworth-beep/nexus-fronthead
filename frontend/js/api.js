// LAYER: Frontend API client — single fetch wrapper
// Nothing else in frontend/ may call fetch() directly.

// 1. Point this to your live Render URL!
const API_BASE = 'https://nexus-backend-qaj2.onrender.com'; 

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

    // 2. Prepend API_BASE to the path so it reaches Render
    const res = await fetch(`${API_BASE}${path}`, opts);
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
