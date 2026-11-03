import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute() {
  const { token, loading } = useAuth()

  if (loading) {
    return <main className="loading-screen"><span className="loader" /><p>Preparando a cozinha...</p></main>
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />
}
