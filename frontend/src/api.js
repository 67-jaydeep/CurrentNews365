import axios from 'axios'

// ✅ Dynamically choose baseURL based on environment
const api = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:5000/api'
      : '/api',
  withCredentials: true, // allows httpOnly cookie
})

// Temporary in-memory store for accessToken
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}
export const clearAccessToken = () => {
  accessToken = null
}

// Attach token to every request
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Handle token expiry → auto-refresh (safe version)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // ✅ Prevent infinite loop and repeated refresh requests
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/refresh')
    ) {
      original._retry = true

      try {
        const refresh = await axios.post(
          `${api.defaults.baseURL.replace('/api', '')}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newAccess = refresh.data?.accessToken

        if (newAccess) {
          setAccessToken(newAccess)
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        }
      } catch (err) {
        // ✅ Stop loop if refresh endpoint itself fails (401, 429, etc.)
        console.warn('🔒 Refresh failed:', err.response?.data?.msg || err.message)
        clearAccessToken()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }

    // ✅ Stop retry chain on rate-limit
    if (error.response?.status === 429) {
      console.warn('🚫 Rate limit reached, not retrying request.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
