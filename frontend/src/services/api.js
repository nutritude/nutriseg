import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de request: loga cada chamada para diagnóstico
api.interceptors.request.use(
    (config) => {
        const fullUrl = (config.baseURL || '') + (config.url || '');
        console.log(`[API] ➡️  ${config.method?.toUpperCase()} ${fullUrl}`);
        return config;
    },
    (error) => {
        console.error('[API] Erro na requisição:', error);
        return Promise.reject(error);
    }
);

// Interceptor de response: loga erros com detalhes
api.interceptors.response.use(
    (response) => {
        console.log(`[API] ✅ ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();
        const msg = error.response?.data?.error || error.message;
        console.error(`[API] ❌ ${status} ${method} ${url} → ${msg}`);
        return Promise.reject(error);
    }
);

export default api;
