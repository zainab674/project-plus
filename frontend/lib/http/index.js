import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true
});

// Add request interceptor to include Authorization header
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token storage
api.interceptors.response.use(
    (response) => {
        // If response contains a token, store it
        if (response.data?.token) {
            localStorage.setItem('authToken', response.data.token);
        }
        return response;
    },
    (error) => {
        // If token is invalid, remove it
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
        }
        return Promise.reject(error);
    }
);


