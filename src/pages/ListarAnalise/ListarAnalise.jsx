import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getUsuarioLogado } from '../../services/sessao'
import SidebarGestor from '../../components/SidebarGestor'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'

const badgeStatus = {
  concluida: 'bg-success',
  processando: 'bg-warning text-dark',
  erro: 'bg-danger',
}

const ListarAnalise = () => {
  const usuario = getUsuarioLogado()
  const [analises, setAnalises] = useState([])

  useEffect(() => {
    api
      .get('/analises')
      .then((response) => setAnalises(response.data))
      .catch((error) => console.error('Erro ao buscar análises.', error))
  }, [])

  const Sidebar = usuario?.papel === 'gestor' ? SidebarGestor : SidebarOperador

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Histórico de Análises" />

        <div className="card shadow-sm">
          <div className="card-body">
            {analises.length > 0 && (
              <table className="table table-hover align-middle">
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
                        <i className="fas fa-file-csv me-2 text-muted"></i>
                        {analise.titulo}
                      </td>
                      <td>{analise.criadoEm}</td>
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
              </table>
            )}

            {analises.length === 0 && <p className="text-muted mb-0">Nenhuma análise encontrada.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListarAnalise
