import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const NovoProjeto = () => {
  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const navigate = useNavigate()

  const enviarProjeto = async (e) => {
    e.preventDefault()

    const projeto = {
      nome,
      cliente,
      criadoEm: new Date().toISOString().slice(0, 10),
    }

    try {
      const response = await api.post('/projetos', projeto)
      alert(`Projeto "${response.data.nome}" cadastrado com sucesso!`)
      navigate('/dashboard/projetos')
    } catch (error) {
      console.error('Não foi possível salvar o projeto.', error)
      alert('Não foi possível salvar o projeto.')
    }
  }

  return (
    <div className="d-flex flex-column flex-md-row">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Cadastro de Projeto" />

        <form className="card shadow-sm p-4" style={{ maxWidth: 480 }} onSubmit={enviarProjeto}>
          <div className="mb-3">
            <label className="form-label">Nome do projeto</label>
            <input className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Cliente</label>
            <input className="form-control" value={cliente} onChange={(e) => setCliente(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Salvar
          </button>
        </form>
      </div>
    </div>
  )
}

export default NovoProjeto
