import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'
import { formatarData } from '../../services/formatadores'
import { formatarTelefone } from '../../services/formatos'

const ListarCliente = () => {
  const [clientes, setClientes] = useState([])
  const [projetos, setProjetos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [idClienteAExcluir, setIdClienteAExcluir] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get('/clientes'), api.get('/projetos')])
      .then(([respostaClientes, respostaProjetos]) => {
        setClientes(respostaClientes.data)
        setProjetos(respostaProjetos.data)
      })
      .catch((error) => {
        console.error('Erro ao buscar a lista de clientes.', error)
        setErro('Não foi possível carregar os clientes.')
      })
      .finally(() => setCarregando(false))
  }, [])

  // Um cliente com projeto ligado não pode ser excluído: o projeto ficaria sem dono.
  const projetosDoCliente = (id) => projetos.filter((p) => String(p.clienteId) === String(id)).length

  const abrirModal = (id) => {
    setIdClienteAExcluir(id)
    setIsModalOpen(true)
  }

  const excluirCliente = async () => {
    try {
      await api.delete(`/clientes/${idClienteAExcluir}`)
      setClientes((clientesAtuais) => clientesAtuais.filter((c) => c.id !== idClienteAExcluir))
    } catch (error) {
      console.error('Não foi possível excluir o cliente.', error)
      setErro(`Não foi possível excluir o cliente com o id ${idClienteAExcluir}.`)
    }
    setIsModalOpen(false)
    setIdClienteAExcluir(null)
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Lista de Clientes" />

        <div className="content-card card shadow-sm">
          <div className="card-body">
            {erro && <div className="alert alert-warning" role="alert">{erro}</div>}
            {carregando && <p className="text-muted">Carregando clientes...</p>}

            {clientes.length > 0 && (
              <div className="table-responsive"><table className="table table-bordered table-striped table-hover align-middle">
                <thead className="table-success">
                  <tr>
                    <th>Cliente</th>
                    <th>Responsável</th>
                    <th>Contato</th>
                    <th>Endereço</th>
                    <th>Projetos</th>
                    <th>Cadastrado em</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <div className="fw-semibold">{cliente.nome}</div>
                        <small className="text-muted">{cliente.documento || 'Sem documento'}</small>
                      </td>
                      <td>{cliente.responsavel || '—'}</td>
                      <td>
                        <div>{formatarTelefone(cliente.telefone)}</div>
                        <small className="text-muted">{cliente.email || '—'}</small>
                      </td>
                      <td>
                        <div>{cliente.endereco || '—'}</div>
                        <small className="text-muted">{cliente.cidade || '—'}</small>
                      </td>
                      <td>
                        <span className="badge bg-primary">{projetosDoCliente(cliente.id)}</span>
                      </td>
                      <td>{formatarData(cliente.criadoEm)}</td>
                      <td className="text-end text-nowrap">
                        <Link
                          to={`/dashboard/clientes/editar/${cliente.id}`}
                          className="btn btn-sm btn-primary me-2"
                          aria-label={`Editar cliente ${cliente.nome}`}
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => abrirModal(cliente.id)}
                          disabled={projetosDoCliente(cliente.id) > 0}
                          title={projetosDoCliente(cliente.id) > 0 ? 'Cliente com projetos ligados' : 'Excluir cliente'}
                          aria-label={`Excluir cliente ${cliente.nome}`}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}

            {!carregando && !erro && clientes.length === 0 && (
              <p className="text-muted">Nenhum cliente cadastrado. Cadastre o primeiro para poder criar projetos.</p>
            )}

            <Link to="/dashboard/clientes/novo" className="btn btn-success">
              <i className="fas fa-plus me-1"></i>Novo Cliente
            </Link>
          </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={excluirCliente} />
    </div>
  )
}

export default ListarCliente
