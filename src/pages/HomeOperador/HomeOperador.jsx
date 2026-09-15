import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getUsuarioLogado } from '../../services/sessao'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'

const HomeOperador = () => {
  const usuario = getUsuarioLogado()
  const [analises, setAnalises] = useState([])

  useEffect(() => {
    api
      .get('/analises')
      .then((response) => setAnalises(response.data))
      .catch((error) => console.error('Erro ao buscar análises.', error))
  }, [])

  const minhasAnalises = analises.filter((a) => String(a.criadoPorId) === String(usuario?.id))
  const recentes = [...minhasAnalises].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 5)

  return (
    <div className="d-flex flex-column flex-md-row">
      <SidebarOperador />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Painel do Operador" />

        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h2 className="h6 mb-1">Minhas análises</h2>
              <p className="mb-0 text-muted">{minhasAnalises.length} análise(s) enviada(s)</p>
            </div>
            <Link to="/analises/nova" className="btn btn-success">
              <i className="fas fa-plus me-1"></i>Nova análise
            </Link>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 mb-0">Análises recentes</h2>
              <Link to="/analises" className="btn btn-sm btn-outline-primary">
                Ver histórico completo
              </Link>
            </div>

            {recentes.length === 0 && <p className="text-muted mb-0">Você ainda não enviou nenhuma análise.</p>}

            {recentes.length > 0 && (
              <table className="table table-hover align-middle mb-0">
                <tbody>
                  {recentes.map((analise) => (
                    <tr key={analise.id}>
                      <td>
                        <i className="fas fa-file-csv me-2 text-muted"></i>
                        {analise.titulo}
                      </td>
                      <td>{analise.criadoEm}</td>
                      <td>
                        <span className="badge bg-success text-capitalize">{analise.status}</span>
                      </td>
                      <td className="text-end">
                        <Link to={`/analises/${analise.id}`} className="btn btn-sm btn-outline-primary">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeOperador
