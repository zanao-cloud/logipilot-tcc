import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { mascaraTelefone, normalizarTelefone } from '../../services/formatos'
import styles from './EsqueciSenha.module.css'

const EsqueciSenha = () => {
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)
  const navigate = useNavigate()

  const redefinir = async (e) => {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (novaSenha !== confirmacao) {
      setErro('As senhas não conferem.')
      return
    }

    setEnviando(true)

    try {
      await api.post('/auth/recuperar-senha', {
        email: email.trim().toLowerCase(),
        telefone: normalizarTelefone(telefone),
        novaSenha,
      })

      setPronto(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (error) {
      console.error('Não foi possível redefinir a senha.', error)
      setErro(error.response?.data?.erro || 'Não foi possível redefinir a senha agora.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.pagina}>
      <Link className={styles.voltar} to="/login">
        <i className="fas fa-arrow-left" /> Voltar para o login
      </Link>

      <form className={`card p-4 shadow-sm ${styles.card}`} onSubmit={redefinir}>
        <div className="text-center mb-4">
          <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
          <h1 className="h5 mt-2 mb-1">Esqueci minha senha</h1>
          <p className="text-muted small mb-0">
            Confirme o telefone do seu cadastro para definir uma senha nova
          </p>
        </div>

        {pronto ? (
          <div className="alert alert-success mb-0" role="status">
            Senha redefinida. Levando você para o login...
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="telefone">Telefone cadastrado</label>
              <input
                id="telefone"
                className="form-control"
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                placeholder="(11) 93936-9341"
                inputMode="tel"
                required
              />
              <div className="form-text">O mesmo telefone informado no cadastro.</div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="novaSenha">Nova senha</label>
              <input
                id="novaSenha"
                type="password"
                className="form-control"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <div className="form-text">Mínimo de 6 caracteres.</div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="confirmacao">Confirmar nova senha</label>
              <input
                id="confirmacao"
                type="password"
                className="form-control"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? 'Redefinindo...' : 'Redefinir senha'}
            </button>

            <p className="text-center small mt-3 mb-0 text-muted">
              Não lembra o telefone cadastrado? Peça ao gestor para redefinir em Acessos.
            </p>
          </>
        )}
      </form>
    </div>
  )
}

export default EsqueciSenha
