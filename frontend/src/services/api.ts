import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 10000,
})

// Restore token from storage
const stored = localStorage.getItem('casino-auth')
if (stored) {
  try {
    const { state } = JSON.parse(stored)
    if (state?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
    }
  } catch {}
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('casino-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
