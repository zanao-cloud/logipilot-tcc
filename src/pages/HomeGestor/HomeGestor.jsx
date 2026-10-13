import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import StatCard from '../../components/StatCard'
import { formatarData } from '../../services/formatadores'

const HomeGestor = () => {
  const [analises, setAnalises] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get('/analises'), api.get('/usuarios')])
      .then(([respostaAnalises, respostaUsuarios]) => {
        setAnalises(respostaAnalises.data)
        setUsuarios(respostaUsuarios.data)
      })
      .catch((error) => {
        console.error('Erro ao carregar o painel.', error)
        setErro('Não foi possível atualizar os dados do painel.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const totalAnalises = analises.length
  const concluidas = analises.filter((a) => a.status === 'concluida').length
  const processando = analises.filter((a) => a.status === 'processando').length
  const comErro = analises.filter((a) => a.status === 'erro').length

  const operadores = usuarios.filter((u) => u.papel === 'operador').length
  const motoristas = usuarios.filter((u) => u.papel === 'motorista').length

  const recentes = [...analises]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 5)

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Painel do Gestor" />

        {erro && <div className="alert alert-warning" role="alert">{erro}</div>}

        <div className="row">
          <StatCard titulo="Total de análises" valor={totalAnalises} icone="fa-file-alt" cor="#06b6d4" />
          <StatCard titulo="Concluídas" valor={concluidas} icone="fa-check-circle" cor="#10b981" />
          <StatCard titulo="Processando" valor={processando} icone="fa-spinner" cor="#f59e0b" />
          <StatCard titulo="Com erro" valor={comErro} icone="fa-triangle-exclamation" cor="#ef4444" />
        </div>

        <div className="content-card card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h2 className="h6 mb-1">Equipe</h2>
              <p className="mb-0 text-muted">
                {operadores} operador(es) · {motoristas} motorista(s)
              </p>
            </div>
            <Link to="/dashboard/acessos" className="btn btn-sm btn-outline-primary">
              Gerenciar acessos
            </Link>
          </div>
        </div>

        <div className="content-card card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 mb-0">Análises recentes</h2>
              <Link to="/analises/nova" className="btn btn-sm btn-success">
                <i className="fas fa-plus me-1"></i>Nova análise
              </Link>
            </div>

            {carregando && <p className="text-muted mb-0">Carregando análises...</p>}
            {!carregando && recentes.length === 0 && <p className="text-muted mb-0">Nenhuma análise ainda.</p>}

            {recentes.length > 0 && (
              <div className="table-responsive"><table className="table table-hover align-middle mb-0">
                <tbody>
                  {recentes.map((analise) => (
                    <tr key={analise.id}>
                      <td>
                        <i className="fas fa-file-lines me-2 text-muted"></i>
                        {analise.titulo}
                      </td>
                      <td>{formatarData(analise.criadoEm)}</td>
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
              </table></div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomeGestor
