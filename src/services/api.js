import axios from 'axios'

// json-server rodando localmente a partir do db.json (npm run api)
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
})

export default api
