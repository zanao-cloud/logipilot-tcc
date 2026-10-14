import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'
import { formatarPlaca, formatarTelefone } from '../../services/formatos'

const ListarAcesso = () => {
  const [acessos, setAcessos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [idAcessoAExcluir, setIdAcessoAExcluir] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState('todos')
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

  // A busca olha nome, e-mail, telefone e placa de uma vez: o gestor às vezes
  // só lembra da placa do veículo ou do final do telefone.
  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const digitos = termo.replace(/\D/g, '')

    return acessos.filter((acesso) => {
      const casaPapel = filtroPapel === 'todos' || acesso.papel === filtroPapel
      const casaBusca = termo === ''
        || acesso.nome.toLowerCase().includes(termo)
        || acesso.email.toLowerCase().includes(termo)
        || (acesso.placa || '').toLowerCase().includes(termo)
        || (digitos !== '' && (acesso.telefone || '').includes(digitos))

      return casaPapel && casaBusca
    })
  }, [acessos, busca, filtroPapel])

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

            <div className="row g-2 mb-3">
              <div className="col-sm-7">
                <label className="visually-hidden" htmlFor="busca">Buscar acesso</label>
                <input
                  id="busca"
                  className="form-control form-control-sm"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, e-mail, telefone ou placa"
                />
              </div>
              <div className="col-sm-5">
                <label className="visually-hidden" htmlFor="filtroPapel">Filtrar por papel</label>
                <select
                  id="filtroPapel"
                  className="form-select form-select-sm"
                  value={filtroPapel}
                  onChange={(e) => setFiltroPapel(e.target.value)}
                >
                  <option value="todos">Todos os papéis</option>
                  <option value="operador">Operadores</option>
                  <option value="motorista">Motoristas</option>
                </select>
              </div>
            </div>
            {visiveis.length > 0 && (
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
                  {visiveis.map((acesso) => (
                    <tr key={acesso.id}>
                      <td>{acesso.nome}</td>
                      <td>{acesso.email}</td>
                      <td className="text-capitalize">{acesso.papel}</td>
                      <td>
                        <div>{formatarTelefone(acesso.telefone)}</div>
                        {acesso.papel === 'motorista' && <small className="text-muted">Placa: {formatarPlaca(acesso.placa)}</small>}
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

            {!carregando && !erro && visiveis.length === 0 && (
              <p className="text-muted">
                {acessos.length === 0
                  ? 'Nenhum acesso cadastrado.'
                  : 'Nenhum acesso encontrado com esse filtro.'}
              </p>
            )}

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
