import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { salvarUsuarioLogado } from '../../services/sessao'
import styles from './Login.module.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const navigate = useNavigate()

  const entrar = async (e) => {
    e.preventDefault()

    try {
      const response = await api.get(`/usuarios?email=${email}`)
      const usuario = response.data[0]

      if (!usuario || usuario.senha !== senha) {
        alert('E-mail ou senha inválidos.')
        return
      }

      salvarUsuarioLogado(usuario)

      if (usuario.papel === 'gestor') {
        navigate('/dashboard')
      } else if (usuario.papel === 'operador') {
        navigate('/operador')
      } else {
        navigate('/motorista')
      }
    } catch (error) {
      console.error('Não foi possível fazer login.', error)
      alert('Não foi possível conectar ao servidor. Verifique se o json-server está rodando.')
    }
  }

  return (
    <div className={styles.pagina}>
      <form className={`card p-4 shadow-sm ${styles.card}`} onSubmit={entrar}>
        <div className="text-center mb-4">
          <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
          <h1 className="h4 mt-2 mb-0">LogiPilot</h1>
          <p className="text-muted small">Entre com sua conta</p>
        </div>

        <div className="mb-3">
          <label className="form-label">E-mail</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Senha</label>
          <input
            type="password"
            className="form-control"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Entrar
        </button>

        <p className="text-muted small text-center mt-4 mb-0">
          Gestor: gestor@logipilot.com<br />
          Operador: operador@logipilot.com<br />
          Motorista: motorista@logipilot.com<br />
          (senha: 123456)
        </p>
      </form>
    </div>
  )
}

export default Login
