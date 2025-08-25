import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export default api;
