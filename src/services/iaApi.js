import axios from 'axios'

// Servidor Express que chama a Groq (npm run ia)
const iaApi = axios.create({
  baseURL: 'http://localhost:3333',
  timeout: 60000,
})

export default iaApi
