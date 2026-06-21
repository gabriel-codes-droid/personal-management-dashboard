import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    timeout: 15000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('pmd_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            // token invalid/expired — clear and let route guard redirect
            localStorage.removeItem('pmd_token');
            localStorage.removeItem('pmd_user');
        }
        return Promise.reject(err);
    }
);

export const auth = {
    signup: (data) => api.post('/auth/signup', data).then(r => r.data),
    login: (data) => api.post('/auth/login', data).then(r => r.data),
    me: () => api.get('/auth/me').then(r => r.data),
};

export const meals = {
    list: () => api.get('/meals').then(r => r.data),
    create: (data) => api.post('/meals', data).then(r => r.data),
    update: (id, data) => api.put(`/meals/${id}`, data).then(r => r.data),
    remove: (id) => api.delete(`/meals/${id}`).then(r => r.data),
};

export const transactions = {
    list: () => api.get('/finances').then(r => r.data),
    create: (data) => api.post('/finances', data).then(r => r.data),
    update: (id, data) => api.put(`/finances/${id}`, data).then(r => r.data),
    remove: (id) => api.delete(`/finances/${id}`).then(r => r.data),
};

export const activities = {
    list: () => api.get('/activities').then(r => r.data),
    create: (data) => api.post('/activities', data).then(r => r.data),
    update: (id, data) => api.put(`/activities/${id}`, data).then(r => r.data),
    remove: (id) => api.delete(`/activities/${id}`).then(r => r.data),
};

export const admin = {
    listUsers: () => api.get('/admin/users').then(r => r.data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
    setRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data),
    stats: () => api.get('/admin/stats').then(r => r.data),
};

export default api;
