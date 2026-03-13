const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const STORAGE_KEY = "accessToken"

type QueryValue = string | number | boolean | null | undefined

type RequestOptions = {
  params?: Record<string, QueryValue>
}

type ApiResponse<T> = {
  data: T
  status: number
}

class ApiError extends Error {
  response: {
    status: number
    data: unknown
  }

  constructor(status: number, data: unknown, message = "API request failed") {
    super(message)
    this.name = "ApiError"
    this.response = { status, data }
  }
}

const buildUrl = (path: string, params?: Record<string, QueryValue>) => {
  const url = new URL(path, API_BASE_URL)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return
      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(STORAGE_KEY)
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

const handleUnauthorized = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
    window.location.href = "/auth/login"
  }
}

const request = async <T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> => {
  const response = await fetch(buildUrl(path, options?.params), {
    method,
    headers: getAuthHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
    }
    throw new ApiError(response.status, data)
  }

  return {
    data: data as T,
    status: response.status,
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, undefined, options),
}
