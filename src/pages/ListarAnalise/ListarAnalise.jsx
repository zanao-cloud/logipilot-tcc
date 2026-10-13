import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getUsuarioLogado } from '../../services/sessao'
import SidebarGestor from '../../components/SidebarGestor'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import { formatarData } from '../../services/formatadores'

const badgeStatus = {
  concluida: 'bg-success',
  processando: 'bg-warning text-dark',
  erro: 'bg-danger',
}

const ListarAnalise = () => {
  const usuario = getUsuarioLogado()
  const [analises, setAnalises] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/analises')
      .then((response) => {
        const dados = usuario?.papel === 'gestor'
          ? response.data
          : response.data.filter((analise) => String(analise.criadoPorId) === String(usuario?.id))
        setAnalises(dados)
      })
      .catch((error) => {
        console.error('Erro ao buscar análises.', error)
        setErro('Não foi possível carregar o histórico de análises.')
      })
      .finally(() => setCarregando(false))
  }, [usuario?.id, usuario?.papel])

  const Sidebar = usuario?.papel === 'gestor' ? SidebarGestor : SidebarOperador

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <Sidebar />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Histórico de Análises" />

        <div className="content-card card shadow-sm">
          <div className="card-body">
            {erro && <div className="alert alert-warning" role="alert">{erro}</div>}
            {carregando && <p className="text-muted mb-0">Carregando análises...</p>}
            {analises.length > 0 && (
              <div className="table-responsive"><table className="table table-hover align-middle mb-0">
                <thead className="table-success">
                  <tr>
                    <th>Título</th>
                    <th>Criado em</th>
                    <th>Status</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {analises.map((analise) => (
                    <tr key={analise.id}>
                      <td>
                        <i className="fas fa-file-lines me-2 text-muted"></i>
                        {analise.titulo}
                      </td>
                      <td>{formatarData(analise.criadoEm)}</td>
                      <td>
                        <span
                          className={`badge ${badgeStatus[analise.status] || 'bg-secondary'} text-capitalize`}
                        >
                          {analise.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link to={`/analises/${analise.id}`} className="btn btn-sm btn-outline-primary">
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}

            {!carregando && !erro && analises.length === 0 && <p className="text-muted mb-0">Nenhuma análise encontrada.</p>}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ListarAnalise
