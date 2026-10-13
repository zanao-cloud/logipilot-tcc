import { Navigate, useLocation } from 'react-router-dom'
import { getUsuarioLogado } from '../services/sessao'

const rotaInicialDoUsuario = (usuario) => {
  if (usuario?.papel === 'gestor') return '/dashboard'
  if (usuario?.papel === 'operador') return '/operador'
  return '/motorista'
}

export const ProtectedRoute = ({ children, papeis }) => {
  const usuario = getUsuarioLogado()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />
  }

  if (papeis && !papeis.includes(usuario.papel)) {
    return <Navigate to={rotaInicialDoUsuario(usuario)} replace />
  }

  return children
}

export const PublicOnlyRoute = ({ children }) => {
  const usuario = getUsuarioLogado()

  if (usuario) {
    return <Navigate to={rotaInicialDoUsuario(usuario)} replace />
  }

  return children
}
