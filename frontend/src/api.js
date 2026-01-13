import axios from 'axios'

const API_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api'
    : import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// In-memory access token
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

export const clearAccessToken = () => {
  accessToken = null
}

// Attach token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Auto refresh (safe)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/refresh')
    ) {
      original._retry = true

      try {
        const refresh = await api.post('/auth/refresh');

        const newAccess = refresh.data?.accessToken
        if (newAccess) {
          setAccessToken(newAccess)
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        }
      } catch (err) {
        clearAccessToken()
      }
    }

    return Promise.reject(error)
  }
)

export default api
