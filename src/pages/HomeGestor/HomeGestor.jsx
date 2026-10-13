import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import iaApi from '../../services/iaApi'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'
import StatCard from '../../components/StatCard'
import { getUsuarioLogado } from '../../services/sessao'
import { formatarData } from '../../services/formatadores'
import { formatarPlaca } from '../../services/formatos'

const HomeGestor = () => {
  const usuario = getUsuarioLogado()
  const navigate = useNavigate()
  const [analises, setAnalises] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [relatorio, setRelatorio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get('/analises'), api.get('/usuarios'), api.get('/relatorios/entregas')])
      .then(([respostaAnalises, respostaUsuarios, respostaRelatorio]) => {
        setAnalises(respostaAnalises.data)
        setUsuarios(respostaUsuarios.data)
        setRelatorio(respostaRelatorio.data)
      })
      .catch((error) => {
        console.error('Erro ao carregar o painel.', error)
        setErro('Não foi possível atualizar os dados do painel.')
      })
      .finally(() => setCarregando(false))
  }, [])

  /**
   * Gera uma análise a partir das entregas que o próprio sistema registrou —
   * sem planilha nenhuma — e a salva como qualquer outra análise.
   */
  const analisarOperacao = async () => {
    if (!relatorio || relatorio.totais.entregas === 0) {
      setErro('Não há entregas registradas no período para analisar.')
      return
    }

    setAnalisando(true)
    setErro('')

    try {
      const { data: resultado } = await iaApi.post('/analisar-operacao', { relatorio })

      const { data: salva } = await api.post('/analises', {
        titulo: `Operação de entregas · ${formatarData(relatorio.de)} a ${formatarData(relatorio.ate)}`,
        projetoId: null,
        criadoPorId: usuario.id,
        status: 'concluida',
        criadoEm: new Date().toISOString().slice(0, 10),
        serieTemporal: resultado.serieTemporal || [],
        fontes: resultado.fontes || [],
        resultado,
      })

      navigate(`/analises/${salva.id}`)
    } catch (error) {
      console.error('Não foi possível analisar a operação.', error)
      setErro(
        error.response?.data?.erro
        || (error.code === 'ERR_NETWORK'
          ? 'O servidor de IA não respondeu. Rode "npm run ia" e tente de novo.'
          : 'Não foi possível gerar a análise da operação.'),
      )
    } finally {
      setAnalisando(false)
    }
  }

  const totalAnalises = analises.length
  const operadores = usuarios.filter((u) => u.papel === 'operador').length
  const motoristas = usuarios.filter((u) => u.papel === 'motorista').length

  const totais = relatorio?.totais
  const recentes = [...analises]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 5)

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Painel do Gestor" />

        {erro && <div className="alert alert-warning" role="alert">{erro}</div>}

        {/* Indicadores da operação, calculados sobre as entregas registradas. */}
        <div className="row">
          <StatCard
            titulo="Entregas no período"
            valor={totais ? totais.entregas : '—'}
            icone="fa-box"
            cor="#06b6d4"
          />
          <StatCard
            titulo="Pontualidade"
            valor={totais && totais.pontualidade !== null ? `${totais.pontualidade}%` : '—'}
            icone="fa-clock"
            cor="#10b981"
          />
          <StatCard
            titulo="Sem ninguém no local"
            valor={totais ? totais.ausentes : '—'}
            icone="fa-house-circle-xmark"
            cor="#ef4444"
          />
          <StatCard
            titulo="Km rodados"
            valor={totais ? totais.kmRodados : '—'}
            icone="fa-road"
            cor="#f59e0b"
          />
        </div>

        <div className="content-card card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h2 className="h6 mb-1">Operação de entregas</h2>
              <p className="mb-0 text-muted">
                {relatorio
                  ? `${formatarData(relatorio.de)} a ${formatarData(relatorio.ate)} · ${totais.entregues} entregue(s), ${totais.pendentes} pendente(s), ${totais.volumes} volume(s)`
                  : 'Carregando indicadores...'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={analisarOperacao}
              disabled={analisando || !relatorio || relatorio.totais.entregas === 0}
              title="Gera um diagnóstico com a IA a partir das entregas registradas"
            >
              <i className={`fas ${analisando ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} me-2`}></i>
              {analisando ? 'Analisando...' : 'Analisar entregas com IA'}
            </button>
          </div>
        </div>

        {relatorio && relatorio.porMotorista.length > 0 && (
          <div className="content-card card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h6 mb-3">Desempenho por motorista</h2>
              <div className="table-responsive"><table className="table table-hover align-middle mb-0">
                <thead className="table-success">
                  <tr>
                    <th>Motorista</th>
                    <th className="text-center">Entregas</th>
                    <th className="text-center">Concluídas</th>
                    <th className="text-center">Ausências</th>
                    <th className="text-center">Pontualidade</th>
                    <th className="text-center">Km</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.porMotorista.map((linha) => (
                    <tr key={linha.motoristaId}>
                      <td>
                        <div className="fw-semibold">{linha.motorista}</div>
                        <small className="text-muted">Placa {formatarPlaca(linha.placa)}</small>
                      </td>
                      <td className="text-center">{linha.entregas}</td>
                      <td className="text-center">{linha.entregues}</td>
                      <td className="text-center">
                        {linha.ausentes > 0
                          ? <span className="badge bg-danger">{linha.ausentes}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-center">
                        {linha.pontualidade === null
                          ? <span className="text-muted">—</span>
                          : <span className={`badge ${linha.pontualidade >= 90 ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {linha.pontualidade}%
                            </span>}
                      </td>
                      <td className="text-center">{linha.kmRodados}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {relatorio && relatorio.porCliente.some((c) => c.ausentes > 0) && (
          <div className="content-card card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h6 mb-1">Clientes com porta fechada</h2>
              <p className="small text-muted mb-3">
                Onde o motorista mais foi e não encontrou ninguém — é aqui que ajustar a janela rende mais.
              </p>
              <div className="table-responsive"><table className="table table-sm align-middle mb-0">
                <tbody>
                  {relatorio.porCliente.filter((c) => c.ausentes > 0).map((linha) => (
                    <tr key={linha.clienteId}>
                      <td className="fw-semibold">{linha.cliente}</td>
                      <td>{linha.ausentes} de {linha.entregas} entrega(s)</td>
                      <td className="text-end">
                        <span className="badge bg-danger">{linha.taxaDeAusencia}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

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
              <h2 className="h6 mb-0">Análises recentes ({totalAnalises})</h2>
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
