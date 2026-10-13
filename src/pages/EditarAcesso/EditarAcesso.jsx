import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
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
      const dadosAtualizados = {
        ...acesso,
        nome: acesso.nome.trim(),
        email: acesso.email.trim().toLowerCase(),
        telefone: acesso.telefone.trim(),
        ...(acesso.papel === 'motorista' ? { placa: acesso.placa?.trim().toUpperCase() } : { placa: '' }),
      }
      const existente = await api.get('/usuarios', { params: { email: dadosAtualizados.email } })
      if (existente.data.some((usuario) => String(usuario.id) !== String(id))) {
        setErro('Já existe outro acesso cadastrado com este e-mail.')
        return
      }
      await api.put(`/usuarios/${id}`, dadosAtualizados)
      navigate('/dashboard/acessos')
    } catch (error) {
      console.error('Não foi possível atualizar o acesso.', error)
      setErro('Não foi possível atualizar o acesso. Tente novamente.')
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
              value={acesso.telefone}
              onChange={handleChange}
              required
            />
          </div>

          {acesso.papel === 'motorista' && (
            <div className="mb-3">
              <label className="form-label">Placa do veículo</label>
              <input
                className="form-control"
                name="placa"
                value={acesso.placa || ''}
                onChange={handleChange}
                required
              />
            </div>
          )}

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
