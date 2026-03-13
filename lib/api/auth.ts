import { api } from "@/lib/api"
import type { AuthUser } from "@/lib/types"

export const authApi = {
  signup: async (name: string, email: string, password: string) => {
    const res = await api.post<{ success: true; data: { user: AuthUser; token: string } }>(
      "/api/auth/signup",
      { name, email, password }
    )
    return res.data.data
  },

  login: async (email: string, password: string) => {
    const res = await api.post<{ success: true; data: { user: AuthUser; token: string } }>(
      "/api/auth/login",
      { email, password }
    )
    return res.data.data
  },

  me: async () => {
    const res = await api.get<{ success: true; data: { user: AuthUser } }>("/api/auth/me")
    return res.data.data.user
  },
}
