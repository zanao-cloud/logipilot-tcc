import { getUsuarioLogado } from '../services/sessao'
import styles from './CredentialUser.module.css'

const CredentialUser = ({ title }) => {
  const usuario = getUsuarioLogado()

  return (
    <header className={styles.cabecalho}>
      <div className={styles.titulo}>{title}</div>
      <div className={styles.usuario}>
        <span className={styles.rotulo}>Usuário</span>
        <span>{usuario ? usuario.nome : '—'}</span>
        <span className={styles.separador} aria-hidden="true">•</span>
        <span className="text-capitalize">{usuario ? usuario.papel : '—'}</span>
      </div>
    </header>
  )
}

export default CredentialUser
