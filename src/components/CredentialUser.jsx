import { getUsuarioLogado } from '../services/sessao'

const CredentialUser = ({ title }) => {
  const usuario = getUsuarioLogado()

  const customStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  }

  const pageInfo = {
    backgroundColor: '#fafdf4',
    color: '#0a1628',
    fontWeight: 'bold',
    padding: '10px 16px',
    borderRadius: '8px',
  }

  const userInfo = {
    backgroundColor: '#fafdf4',
    color: '#0a1628',
    padding: '10px 16px',
    borderRadius: '8px',
  }

  return (
    <div style={customStyles}>
      <div style={pageInfo}>{title}</div>
      <div style={userInfo}>
        Usuário: {usuario ? usuario.nome : '—'} | Função: {usuario ? usuario.papel : '—'}
      </div>
    </div>
  )
}

export default CredentialUser
