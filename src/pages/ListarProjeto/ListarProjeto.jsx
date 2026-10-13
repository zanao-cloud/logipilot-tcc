import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'
import { formatarData } from '../../services/formatadores'

const ListarProjeto = () => {
  const [projetos, setProjetos] = useState([])
  const [clientes, setClientes] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [idProjetoAExcluir, setIdProjetoAExcluir] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get('/projetos'), api.get('/clientes')])
      .then(([respostaProjetos, respostaClientes]) => {
        setProjetos(respostaProjetos.data)
        setClientes(respostaClientes.data)
      })
      .catch((error) => {
        console.error('Erro ao buscar a lista de projetos.', error)
        setErro('Não foi possível carregar os projetos.')
      })
      .finally(() => setCarregando(false))
  }, [])

  // O nome vem do cadastro de clientes; o campo antigo do projeto só é usado
  // como reserva para projetos criados antes do cadastro de clientes existir.
  const nomeDoCliente = (projeto) => {
    const cliente = clientes.find((c) => String(c.id) === String(projeto.clienteId))
    return cliente ? cliente.nome : projeto.cliente || '—'
  }

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
    setIdProjetoAExcluir(null)
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Lista de Projetos" />

        <div className="content-card card shadow-sm">
          <div className="card-body">
            {erro && <div className="alert alert-warning" role="alert">{erro}</div>}
            {carregando && <p className="text-muted">Carregando projetos...</p>}
            {projetos.length > 0 && (
              <div className="table-responsive"><table className="table table-bordered table-striped table-hover align-middle">
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
                      <td>{nomeDoCliente(projeto)}</td>
                      <td>{formatarData(projeto.criadoEm)}</td>
                      <td className="text-end">
                        <Link
                          to={`/dashboard/projetos/editar/${projeto.id}`}
                          className="btn btn-sm btn-primary me-2"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </Link>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => abrirModal(projeto.id)} aria-label={`Excluir projeto ${projeto.nome}`}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}

            {!carregando && !erro && projetos.length === 0 && <p className="text-muted">Nenhum projeto cadastrado.</p>}

            <Link to="/dashboard/projetos/novo" className="btn btn-success">
              <i className="fas fa-plus me-1"></i>Novo Projeto
            </Link>
          </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={excluirProjeto} />
    </div>
  )
}

export default ListarProjeto
