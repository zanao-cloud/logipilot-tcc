import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'

const ListarAcesso = () => {
  const [acessos, setAcessos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [idAcessoAExcluir, setIdAcessoAExcluir] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/usuarios')
      .then((response) => {
        const somenteOperadoresEMotoristas = response.data.filter((u) => u.papel !== 'gestor')
        setAcessos(somenteOperadoresEMotoristas)
      })
      .catch((error) => {
        console.error('Erro ao buscar a lista de acessos.', error)
        setErro('Não foi possível carregar os acessos.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const abrirModal = (id) => {
    setIdAcessoAExcluir(id)
    setIsModalOpen(true)
  }

  const excluirAcesso = async () => {
    try {
      await api.delete(`/usuarios/${idAcessoAExcluir}`)
      setAcessos((acessosAtuais) => acessosAtuais.filter((a) => a.id !== idAcessoAExcluir))
    } catch (error) {
      console.error('Não foi possível excluir o acesso.', error)
      alert(`Não foi possível excluir o acesso com o id ${idAcessoAExcluir}`)
    }
    setIsModalOpen(false)
    setIdAcessoAExcluir(null)
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Lista de Acessos" />

        <div className="content-card card shadow-sm">
          <div className="card-body">
            {erro && <div className="alert alert-warning" role="alert">{erro}</div>}
            {carregando && <p className="text-muted">Carregando acessos...</p>}
            {acessos.length > 0 && (
              <div className="table-responsive"><table className="table table-bordered table-striped table-hover align-middle">
                <thead className="table-success">
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Contato</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {acessos.map((acesso) => (
                    <tr key={acesso.id}>
                      <td>{acesso.nome}</td>
                      <td>{acesso.email}</td>
                      <td className="text-capitalize">{acesso.papel}</td>
                      <td>
                        <div>{acesso.telefone || '—'}</div>
                        {acesso.papel === 'motorista' && <small className="text-muted">Placa: {acesso.placa || '—'}</small>}
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/dashboard/acessos/editar/${acesso.id}`}
                          className="btn btn-sm btn-primary me-2"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </Link>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => abrirModal(acesso.id)} aria-label={`Excluir acesso de ${acesso.nome}`}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}

            {!carregando && !erro && acessos.length === 0 && <p className="text-muted">Nenhum acesso cadastrado.</p>}

            <Link to="/dashboard/acessos/novo" className="btn btn-success">
              <i className="fas fa-plus me-1"></i>Novo Acesso
            </Link>
          </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={excluirAcesso} />
    </div>
  )
}

export default ListarAcesso
