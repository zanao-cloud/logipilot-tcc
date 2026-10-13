import axios from 'axios'

// API REST do Spring Boot (backend/, porta 8080). O Vite faz o proxy de /api.
const api = axios.create({
baseURL: '/api',
  timeout: 10000,
})

export default api
