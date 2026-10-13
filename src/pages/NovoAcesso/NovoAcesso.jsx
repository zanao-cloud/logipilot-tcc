import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { mascaraPlaca, mascaraTelefone, placaValida, telefoneValido, normalizarPlaca, normalizarTelefone } from '../../services/formatos'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const NovoAcesso = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [papel, setPapel] = useState('operador')
  const [telefone, setTelefone] = useState('')
  const [placa, setPlaca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const escolherPapel = (e) => {
    setPapel(e.target.value)
  }

  const enviarAcesso = async (e) => {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (!telefoneValido(telefone)) {
      setErro('Telefone inválido. Use DDD + número, como (11) 93936-9341.')
      return
    }

    if (papel === 'motorista' && !placaValida(placa)) {
      setErro('Placa inválida. Use o padrão Mercosul (ABC1D23) ou o antigo (ABC1234).')
      return
    }

    setEnviando(true)

    try {
      // A senha vai em texto; quem gera o hash BCrypt é o Spring.
      // O e-mail repetido também é recusado lá, com 409.
      await api.post('/usuarios', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        papel,
        telefone: normalizarTelefone(telefone),
        ...(papel === 'motorista' ? { placa: normalizarPlaca(placa) } : {}),
      })

      navigate('/dashboard/acessos')
    } catch (error) {
      console.error('Não foi possível salvar o acesso.', error)
      setErro(error.response?.data?.erro || 'Não foi possível salvar o acesso. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Cadastro de Acesso" />

        <form className="content-card page-form card shadow-sm p-4" onSubmit={enviarAcesso}>
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
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
              minLength={6}
              required
            />
            <div className="form-text">Mínimo de 6 caracteres.</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Papel</label>
            <select className="form-select" value={papel} onChange={escolherPapel}>
              <option value="operador">Operador</option>
              <option value="motorista">Motorista</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Telefone</label>
            <input
              className="form-control"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              placeholder="(11) 93936-9341"
              inputMode="tel"
              required
            />
            <div className="form-text">Celular com 9 dígitos ou fixo com 8, sempre com DDD.</div>
          </div>

          {papel === 'motorista' && (
            <div className="mb-3">
              <label className="form-label">Placa do veículo</label>
              <input
                className="form-control text-uppercase"
                value={placa}
                onChange={(e) => setPlaca(mascaraPlaca(e.target.value))}
                placeholder="ABC1D23"
                maxLength={7}
                required
              />
              <div className="form-text">Mercosul (ABC1D23) ou antiga (ABC1234).</div>
            </div>
          )}

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default NovoAcesso
