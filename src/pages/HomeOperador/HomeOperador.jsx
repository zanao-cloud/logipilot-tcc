import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getUsuarioLogado } from '../../services/sessao'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import { formatarData } from '../../services/formatadores'
import { foiConcluida, hojeISO } from '../../services/entregas'

const HomeOperador = () => {
  const usuario = getUsuarioLogado()
  const [analises, setAnalises] = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [entregas, setEntregas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get('/analises'), api.get('/usuarios'), api.get('/entregas')])
      .then(([respostaAnalises, respostaUsuarios, respostaEntregas]) => {
        setAnalises(respostaAnalises.data)
        setMotoristas(respostaUsuarios.data.filter((u) => u.papel === 'motorista'))
        setEntregas(respostaEntregas.data)
      })
      .catch((error) => {
        console.error('Erro ao carregar o painel do operador.', error)
        setErro('Não foi possível carregar os dados do painel agora.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const hoje = hojeISO()
  const entregasDeHoje = entregas.filter((entrega) => entrega.data === hoje)
  const pendentesDeHoje = entregasDeHoje.filter((entrega) => !foiConcluida(entrega)).length
  const semRota = motoristas.filter(
    (motorista) => !entregasDeHoje.some((entrega) => String(entrega.motoristaId) === String(motorista.id)),
  ).length

  const minhasAnalises = analises.filter((a) => String(a.criadoPorId) === String(usuario?.id))
  const recentes = [...minhasAnalises].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 5)

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarOperador />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Painel do Operador" />
        {erro && <div className="alert alert-warning" role="alert">{erro}</div>}

        <div className="content-card card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h2 className="h6 mb-1">Entregas de hoje</h2>
              <p className="mb-0 text-muted">
                {motoristas.length} motorista(s) · {entregasDeHoje.length} entrega(s) designada(s) ·{' '}
                {pendentesDeHoje} pendente(s)
                {semRota > 0 && ` · ${semRota} motorista(s) ainda sem rota`}
              </p>
            </div>
            <Link to="/operador/motoristas" className="btn btn-success">
              <i className="fas fa-truck me-1"></i>Designar entregas
            </Link>
          </div>
        </div>

        <div className="content-card card shadow-sm mb-4">
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

        <div className="content-card card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 mb-0">Análises recentes</h2>
              <Link to="/analises" className="btn btn-sm btn-outline-primary">
                Ver histórico completo
              </Link>
            </div>

            {carregando && <p className="text-muted mb-0">Carregando análises...</p>}
            {!carregando && recentes.length === 0 && <p className="text-muted mb-0">Você ainda não enviou nenhuma análise.</p>}

            {recentes.length > 0 && (
              <div className="table-responsive"><table className="table table-hover align-middle mb-0">
                <tbody>
                  {recentes.map((analise) => (
                    <tr key={analise.id}>
                      <td>
                        <i className="fas fa-file-csv me-2 text-muted"></i>
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

export default HomeOperador
