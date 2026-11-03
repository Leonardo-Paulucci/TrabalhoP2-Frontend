import type { Recipe, RecipeInput, User } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.message || data.error || 'Não foi possível concluir a solicitação.', response.status)
  }
  return data as T
}

export const api = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; id: number; username: string; firstName: string; lastName: string; image?: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password, expiresInMins: 60 }) },
    ),
  me: (token: string) => request<User>('/auth/me', {}, token),
  recipes: (token: string) =>
    request<{ recipes: Recipe[]; total: number }>('/recipes?limit=50&skip=0&select=id,name,cuisine,image,prepTimeMinutes,cookTimeMinutes,servings,difficulty', {}, token),
  searchRecipes: (query: string, token: string) =>
    request<{ recipes: Recipe[] }>(`/recipes/search?q=${encodeURIComponent(query)}&select=id,name,cuisine,image,prepTimeMinutes,cookTimeMinutes,servings,difficulty`, {}, token),
  addRecipe: (input: RecipeInput, token: string) =>
    request<Recipe>('/recipes/add', { method: 'POST', body: JSON.stringify(input) }, token),
  updateRecipe: (id: number, input: RecipeInput, token: string) =>
    request<Recipe>(`/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, token),
  deleteRecipe: (id: number, token: string) =>
    request<{ id: number; isDeleted: boolean }>(`/recipes/${id}`, { method: 'DELETE' }, token),
}