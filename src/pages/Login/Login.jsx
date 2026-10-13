import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { conferirSenha } from '../../services/senha'
import { salvarUsuarioLogado } from '../../services/sessao'
import styles from './Login.module.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const entrar = async (e) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      const response = await api.get('/usuarios', { params: { email: email.trim().toLowerCase() } })
      const usuario = response.data[0]

      if (!usuario || !(await conferirSenha(senha, usuario.senha))) {
        setErro('E-mail ou senha inválidos.')
        return
      }

      salvarUsuarioLogado(usuario)

      const destinoOriginal = location.state?.de

      if (destinoOriginal && destinoOriginal !== '/login') {
        navigate(destinoOriginal, { replace: true })
      } else if (usuario.papel === 'gestor') {
        navigate('/dashboard')
      } else if (usuario.papel === 'operador') {
        navigate('/operador')
      } else {
        navigate('/motorista')
      }
    } catch (error) {
      console.error('Não foi possível fazer login.', error)
      setErro('Não foi possível conectar ao servidor. Verifique se o json-server está rodando.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.pagina}>
      <Link className={styles.voltar} to="/">
        <i className="fas fa-arrow-left" /> Conhecer o LogiPilot
      </Link>

      <form className={`card p-4 shadow-sm ${styles.card}`} onSubmit={entrar}>
        <div className="text-center mb-4">
          <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
          <h1 className="h5 mt-2 mb-1">Entrar</h1>
          <p className="text-muted small mb-0">Acesse o painel da sua operação</p>
        </div>

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
          <label className="form-label" htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="form-control"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center small mt-3 mb-0">
          Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link>
        </p>
      </form>
    </div>
  )
}

export default Login
