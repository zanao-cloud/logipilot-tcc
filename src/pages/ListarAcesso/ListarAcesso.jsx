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

  useEffect(() => {
    api
      .get('/usuarios')
      .then((response) => {
        const somenteOperadoresEMotoristas = response.data.filter((u) => u.papel !== 'gestor')
        setAcessos(somenteOperadoresEMotoristas)
      })
      .catch((error) => console.error('Erro ao buscar a lista de acessos.', error))
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
  }

  return (
    <div className="d-flex flex-column flex-md-row">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Lista de Acessos" />

        <div className="card shadow-sm">
          <div className="card-body">
            {acessos.length > 0 && (
              <table className="table table-bordered table-striped table-hover align-middle">
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
                      <td>{acesso.papel === 'motorista' ? acesso.placa : acesso.telefone}</td>
                      <td className="text-end">
                        <Link
                          to={`/dashboard/acessos/editar/${acesso.id}`}
                          className="btn btn-sm btn-primary me-2"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </Link>
                        <button className="btn btn-sm btn-danger" onClick={() => abrirModal(acesso.id)}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {acessos.length === 0 && <p className="text-muted">Nenhum acesso cadastrado.</p>}

            <Link to="/dashboard/acessos/novo" className="btn btn-success">
              <i className="fas fa-plus me-1"></i>Novo Acesso
            </Link>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={excluirAcesso} />
    </div>
  )
}

export default ListarAcesso
