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

  useEffect(() => {
    api
      .get(`/usuarios/${id}`)
      .then((response) => setAcesso(response.data))
      .catch((error) => console.error('Erro ao buscar o acesso.', error))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setAcesso((prev) => ({ ...prev, [name]: value }))
  }

  const atualizarAcesso = async (e) => {
    e.preventDefault()

    try {
      await api.put(`/usuarios/${id}`, acesso)
      alert('Acesso atualizado com sucesso!')
      navigate('/dashboard/acessos')
    } catch (error) {
      console.error('Não foi possível atualizar o acesso.', error)
      alert('Não foi possível atualizar o acesso.')
    }
  }

  return (
    <div className="d-flex flex-column flex-md-row">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Edição de Acesso" />

        <form className="card shadow-sm p-4" style={{ maxWidth: 480 }} onSubmit={atualizarAcesso}>
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

          <button type="submit" className="btn btn-primary w-100">
            Salvar alterações
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditarAcesso
