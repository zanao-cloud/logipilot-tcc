import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'

const ListarProjeto = () => {
  const [projetos, setProjetos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [idProjetoAExcluir, setIdProjetoAExcluir] = useState(null)

  useEffect(() => {
    api
      .get('/projetos')
      .then((response) => setProjetos(response.data))
      .catch((error) => console.error('Erro ao buscar a lista de projetos.', error))
  }, [])

  const abrirModal = (id) => {
    setIdProjetoAExcluir(id)
    setIsModalOpen(true)
  }

  const excluirProjeto = async () => {
    try {
      await api.delete(`/projetos/${idProjetoAExcluir}`)
      setProjetos((projetosAtuais) => projetosAtuais.filter((p) => p.id !== idProjetoAExcluir))
    } catch (error) {
      console.error('Não foi possível excluir o projeto.', error)
      alert(`Não foi possível excluir o projeto com o id ${idProjetoAExcluir}`)
    }
    setIsModalOpen(false)
  }

  return (
    <div className="d-flex">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Lista de Projetos" />

        <div className="card shadow-sm">
          <div className="card-body">
            {projetos.length > 0 && (
              <table className="table table-bordered table-striped table-hover align-middle">
                <thead className="table-success">
                  <tr>
                    <th>Nome</th>
                    <th>Cliente</th>
                    <th>Criado em</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((projeto) => (
                    <tr key={projeto.id}>
                      <td>{projeto.nome}</td>
                      <td>{projeto.cliente}</td>
                      <td>{projeto.criadoEm}</td>
                      <td className="text-end">
                        <Link
                          to={`/dashboard/projetos/editar/${projeto.id}`}
                          className="btn btn-sm btn-primary me-2"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </Link>
                        <button className="btn btn-sm btn-danger" onClick={() => abrirModal(projeto.id)}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {projetos.length === 0 && <p className="text-muted">Nenhum projeto cadastrado.</p>}

            <Link to="/dashboard/projetos/novo" className="btn btn-success">
              <i className="fas fa-plus me-1"></i>Novo Projeto
            </Link>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={excluirProjeto} />
    </div>
  )
}

export default ListarProjeto
