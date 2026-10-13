import axios from 'axios'

// json-server rodando localmente a partir do db.json (npm run api)
const api = axios.create({
baseURL: '/api',
  timeout: 10000,
})

export default api
