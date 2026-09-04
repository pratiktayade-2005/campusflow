const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('cf_token');
}

async function request(path, { method = 'GET', body, form, auth = true, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* no body */
  }

  if (!res.ok) {
    const message = data?.detail
      ? Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join(', ')
        : data.detail
      : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),

  login: async (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const res = await fetch(`${BASE_URL}/auth/login`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),

  uploadResume: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/students/me/resume', { method: 'POST', body: fd, isFormData: true });
  },

  uploadPhoto: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/users/me/photo', { method: 'POST', body: fd, isFormData: true });
  },

  uploadCompanyLogo: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/companies/mine/logo', { method: 'POST', body: fd, isFormData: true });
  },

  fileUrl: (path) => (path ? `${BASE_URL}/uploads/${path}` : null),
};

export { getToken, BASE_URL };
