import { defineStore } from 'pinia'
import { login as loginApi, type AdminUser } from '../api'

interface AuthState {
  token: string
  user: AdminUser | null
}

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') as AdminUser | null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.user?.username || '管理员'
  },
  actions: {
    async login(username: string, password: string) {
      const result = await loginApi({ username, password })
      this.token = result.token
      this.user = result.user
      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }
})
