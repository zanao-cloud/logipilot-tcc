import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const EditarProjeto = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projeto, setProjeto] = useState({ nome: '', cliente: '', criadoEm: '' })

  useEffect(() => {
    api
      .get(`/projetos/${id}`)
      .then((response) => setProjeto(response.data))
      .catch((error) => console.error('Erro ao buscar o projeto.', error))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProjeto((prev) => ({ ...prev, [name]: value }))
  }

  const atualizarProjeto = async (e) => {
    e.preventDefault()

    try {
      await api.put(`/projetos/${id}`, projeto)
      alert('Projeto atualizado com sucesso!')
      navigate('/dashboard/projetos')
    } catch (error) {
      console.error('Não foi possível atualizar o projeto.', error)
      alert('Não foi possível atualizar o projeto.')
    }
  }

  return (
    <div className="d-flex flex-column flex-md-row">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Edição de Projeto" />

        <form className="card shadow-sm p-4" style={{ maxWidth: 480 }} onSubmit={atualizarProjeto}>
          <div className="mb-3">
            <label className="form-label">Nome do projeto</label>
            <input className="form-control" name="nome" value={projeto.nome} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Cliente</label>
            <input className="form-control" name="cliente" value={projeto.cliente} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Salvar alterações
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditarProjeto
