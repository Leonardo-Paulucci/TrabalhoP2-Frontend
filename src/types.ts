export interface Recipe {
  id: number
  name: string
  cuisine: string
  image: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings?: number
  difficulty?: string
}

export interface RecipeInput {
  name: string
  cuisine: string
  prepTimeMinutes: number
  cookTimeMinutes: number
}

export interface User {
  id: number
  username: string
  firstName: string
  lastName: string
  image?: string
}
