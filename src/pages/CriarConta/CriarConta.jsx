import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { salvarUsuarioLogado } from '../../services/sessao'
import { mascaraTelefone, normalizarTelefone, telefoneValido } from '../../services/formatos'
import styles from './CriarConta.module.css'

const CriarConta = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const criar = async (e) => {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmacao) {
      setErro('As senhas não conferem.')
      return
    }

    if (!telefoneValido(telefone)) {
      setErro('Telefone inválido. Use DDD + número, como (11) 93936-9341.')
      return
    }

    setEnviando(true)

    try {
      // Quem cria a conta pela tela pública é sempre o gestor da operação.
      // Operadores e motoristas são cadastrados depois, em "Acessos".
      // A senha vai em texto e o Spring guarda só o hash BCrypt dela.
      const resposta = await api.post('/usuarios', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        papel: 'gestor',
        telefone: normalizarTelefone(telefone),
      })

      salvarUsuarioLogado(resposta.data)
      navigate('/dashboard')
    } catch (error) {
      console.error('Não foi possível criar a conta.', error)
      setErro(
        error.response?.data?.erro
        || 'Não foi possível criar a conta. Verifique se a API está rodando (npm run api).',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.pagina}>
      <Link className={styles.voltar} to="/">
        <i className="fas fa-arrow-left" /> Voltar para o site
      </Link>

      <form className={`card p-4 shadow-sm ${styles.card}`} onSubmit={criar}>
        <div className="text-center mb-4">
          <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
          <h1 className="h5 mt-2 mb-1">Criar conta</h1>
          <p className="text-muted small mb-0">
            Esta será a conta de gestor da sua operação.
          </p>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            className="form-control"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
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
          <label className="form-label" htmlFor="telefone">Telefone</label>
          <input
            id="telefone"
            className="form-control"
            value={telefone}
            onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
            placeholder="(11) 93936-9341"
            inputMode="tel"
            required
          />
          <div className="form-text">Celular com 9 dígitos ou fixo com 8, sempre com DDD.</div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="form-control"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            required
          />
          <div className="form-text">Mínimo de 6 caracteres.</div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="confirmacao">Confirmar senha</label>
          <input
            id="confirmacao"
            type="password"
            className="form-control"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            required
          />
        </div>

        {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className="text-center small mt-3 mb-0">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}

export default CriarConta
