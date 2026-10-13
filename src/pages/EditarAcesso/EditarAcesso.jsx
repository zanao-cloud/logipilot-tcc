import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { mascaraPlaca, mascaraTelefone, placaValida, telefoneValido, normalizarPlaca, normalizarTelefone } from '../../services/formatos'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const EditarAcesso = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [acesso, setAcesso] = useState({
    nome: '',
    email: '',
    papel: 'operador',
    telefone: '',
    placa: '',
  })
  const [novaSenha, setNovaSenha] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get(`/usuarios/${id}`)
      .then((response) => setAcesso(response.data))
      .catch((error) => {
        console.error('Erro ao buscar o acesso.', error)
        setErro('Não foi possível carregar o acesso solicitado.')
      })
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setAcesso((prev) => ({ ...prev, [name]: value }))
  }

  const atualizarAcesso = async (e) => {
    e.preventDefault()

    setEnviando(true)
    setErro('')
    try {
      if (novaSenha && novaSenha.length < 6) {
        setErro('A nova senha precisa ter pelo menos 6 caracteres.')
        return
      }

      if (!telefoneValido(acesso.telefone)) {
        setErro('Telefone inválido. Use DDD + número, como (11) 93936-9341.')
        return
      }

      if (acesso.papel === 'motorista' && !placaValida(acesso.placa)) {
        setErro('Placa inválida. Use o padrão Mercosul (ABC1D23) ou o antigo (ABC1234).')
        return
      }

      // Senha em branco significa "manter a atual" — é assim que o Spring trata.
      await api.put(`/usuarios/${id}`, {
        ...acesso,
        nome: acesso.nome.trim(),
        email: acesso.email.trim().toLowerCase(),
        telefone: normalizarTelefone(acesso.telefone),
        senha: novaSenha || null,
        ...(acesso.papel === 'motorista' ? { placa: normalizarPlaca(acesso.placa) } : { placa: '' }),
      })

      navigate('/dashboard/acessos')
    } catch (error) {
      console.error('Não foi possível atualizar o acesso.', error)
      setErro(error.response?.data?.erro || 'Não foi possível atualizar o acesso. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Edição de Acesso" />

        {carregando ? <p className="text-muted">Carregando acesso...</p> : !acesso.id && erro ? <div className="alert alert-danger" role="alert">{erro}</div> : <form className="content-card page-form card shadow-sm p-4" onSubmit={atualizarAcesso}>
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input className="form-control" name="nome" value={acesso.nome} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={acesso.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Papel</label>
            <select className="form-select" name="papel" value={acesso.papel} onChange={handleChange}>
              <option value="operador">Operador</option>
              <option value="motorista">Motorista</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Telefone</label>
            <input
              className="form-control"
              name="telefone"
              value={mascaraTelefone(acesso.telefone || '')}
              onChange={handleChange}
              placeholder="(11) 93936-9341"
              inputMode="tel"
              required
            />
            <div className="form-text">Celular com 9 dígitos ou fixo com 8, sempre com DDD.</div>
          </div>

          {acesso.papel === 'motorista' && (
            <div className="mb-3">
              <label className="form-label">Placa do veículo</label>
              <input
                className="form-control text-uppercase"
                name="placa"
                value={mascaraPlaca(acesso.placa || '')}
                onChange={handleChange}
                placeholder="ABC1D23"
                maxLength={7}
                required
              />
              <div className="form-text">Mercosul (ABC1D23) ou antiga (ABC1234).</div>
            </div>
          )}

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
            />
            <div className="form-text">Deixe em branco para manter a senha atual.</div>
          </div>

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>}
      </main>
    </div>
  )
}

export default EditarAcesso
