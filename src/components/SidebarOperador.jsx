import { Link, useNavigate } from 'react-router-dom'
import { getUsuarioLogado, logout } from '../services/sessao'
import styles from './SidebarOperador.module.css'

const SidebarOperador = () => {
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
        <Link to="/operador" className={`nav-link ${styles.item}`}>
          <i className="fas fa-home me-2"></i>Painel
        </Link>
        <Link to="/analises/nova" className={`nav-link ${styles.item}`}>
          <i className="fas fa-plus me-2"></i>Nova análise
        </Link>
        <Link to="/analises" className={`nav-link ${styles.item}`}>
          <i className="fas fa-history me-2"></i>Histórico
        </Link>
      </nav>

      <div className={styles.usuario}>
        <p className="mb-2 small">{usuario ? usuario.nome : ''}</p>
        <button className="btn btn-outline-light btn-sm w-100" onClick={sair}>
          <i className="fas fa-sign-out-alt me-1"></i>Sair
        </button>
      </div>
    </aside>
  )
}

export default SidebarOperador
