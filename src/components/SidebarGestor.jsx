import { NavLink, useNavigate } from 'react-router-dom'
import { getUsuarioLogado, logout } from '../services/sessao'
import styles from './SidebarGestor.module.css'

const SidebarGestor = () => {
  const navigate = useNavigate()
  const usuario = getUsuarioLogado()

  const sair = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className="text-center mb-4">
        <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
      </div>

      <nav className="nav flex-column flex-grow-1">
        <NavLink to="/dashboard" end className={({ isActive }) => `${styles.item} ${isActive ? styles.ativo : ''}`}>
          <i className="fas fa-chart-line me-2"></i>Visão geral
        </NavLink>
        <NavLink to="/analises/nova" className={({ isActive }) => `${styles.item} ${isActive ? styles.ativo : ''}`}>
          <i className="fas fa-plus me-2"></i>Nova análise
        </NavLink>
        <NavLink to="/analises" end className={({ isActive }) => `${styles.item} ${isActive ? styles.ativo : ''}`}>
          <i className="fas fa-history me-2"></i>Histórico de análises
        </NavLink>
        <NavLink to="/dashboard/clientes" className={({ isActive }) => `${styles.item} ${isActive ? styles.ativo : ''}`}>
          <i className="fas fa-building me-2"></i>Clientes
        </NavLink>
        <NavLink to="/dashboard/projetos" className={({ isActive }) => `${styles.item} ${isActive ? styles.ativo : ''}`}>
          <i className="fas fa-folder me-2"></i>Projetos
        </NavLink>
        <NavLink to="/dashboard/acessos" className={({ isActive }) => `${styles.item} ${isActive ? styles.ativo : ''}`}>
          <i className="fas fa-users me-2"></i>Acessos
        </NavLink>
      </nav>

      <div className={styles.usuario}>
        <p className="mb-2 small">{usuario ? usuario.nome : ''}</p>
        <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={sair}>
          <i className="fas fa-sign-out-alt me-1"></i>Sair
        </button>
      </div>
    </aside>
  )
}

export default SidebarGestor
