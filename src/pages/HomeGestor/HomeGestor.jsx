import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import StatCard from '../../components/StatCard'

const HomeGestor = () => {
  const [analises, setAnalises] = useState([])
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    api
      .get('/analises')
      .then((response) => setAnalises(response.data))
      .catch((error) => console.error('Erro ao buscar análises.', error))

    api
      .get('/usuarios')
      .then((response) => setUsuarios(response.data))
      .catch((error) => console.error('Erro ao buscar usuários.', error))
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
    <div className="d-flex">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Painel do Gestor" />

        <div className="row">
          <StatCard titulo="Total de análises" valor={totalAnalises} icone="fa-file-alt" cor="#1d4ed8" />
          <StatCard titulo="Concluídas" valor={concluidas} icone="fa-check-circle" cor="#16a34a" />
          <StatCard titulo="Processando" valor={processando} icone="fa-spinner" cor="#d97706" />
          <StatCard titulo="Com erro" valor={comErro} icone="fa-triangle-exclamation" cor="#dc2626" />
        </div>

        <div className="card shadow-sm mb-4">
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

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 mb-0">Análises recentes</h2>
              <Link to="/analises/nova" className="btn btn-sm btn-success">
                <i className="fas fa-plus me-1"></i>Nova análise
              </Link>
            </div>

            {recentes.length === 0 && <p className="text-muted mb-0">Nenhuma análise ainda.</p>}

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

export default HomeGestor
