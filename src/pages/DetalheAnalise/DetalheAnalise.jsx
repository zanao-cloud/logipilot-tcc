import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import iaApi from '../../services/iaApi'
import { getUsuarioLogado } from '../../services/sessao'
import { preverTendencia } from '../../services/previsao'
import { formatarNumero } from '../../services/formatadores'
import SidebarGestor from '../../components/SidebarGestor'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import Grafico from '../../components/Grafico'
import styles from './DetalheAnalise.module.css'

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'dashboard', rotulo: 'Dashboard' },
  { id: 'diagnostico', rotulo: 'Diagnóstico' },
  { id: 'gargalos', rotulo: 'Gargalos' },
  { id: 'oportunidades', rotulo: 'Oportunidades' },
  { id: 'planoDeAcao', rotulo: 'Plano de Ação' },
  { id: 'previsao', rotulo: 'Previsão' },
  { id: 'chat', rotulo: 'Chat com os dados' },
]

const corTendencia = { alta: 'bg-success', baixa: 'bg-danger', estavel: 'bg-secondary' }
const corSituacao = { boa: 'bg-success', atencao: 'bg-warning text-dark', critica: 'bg-danger', neutra: 'bg-secondary' }
const corSeveridade = { alta: 'bg-danger', media: 'bg-warning text-dark', baixa: 'bg-secondary' }
const corPrioridade = { alta: 'bg-danger', media: 'bg-warning text-dark', baixa: 'bg-secondary' }
const corEsforco = { alto: 'bg-danger', medio: 'bg-warning text-dark', baixo: 'bg-success' }

const corDoScore = (score) => {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

const comoLista = (valor) => (Array.isArray(valor) ? valor : [])

const DetalheAnalise = () => {
  const { id } = useParams()
  const usuario = getUsuarioLogado()
  const [analise, setAnalise] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('resumo')

  const [pergunta, setPergunta] = useState('')
  const [conversa, setConversa] = useState([])
  const [perguntando, setPerguntando] = useState(false)
  const [erroChat, setErroChat] = useState('')

  useEffect(() => {
    api
      .get(`/analises/${id}`)
      .then((response) => {
        if (usuario?.papel !== 'gestor' && String(response.data.criadoPorId) !== String(usuario?.id)) {
          setErro('Você não tem permissão para visualizar esta análise.')
          return
        }
        setAnalise(response.data)
      })
      .catch((error) => {
        console.error('Erro ao buscar a análise.', error)
        setErro('Não foi possível carregar esta análise. Ela pode ter sido removida.')
      })
      .finally(() => setCarregando(false))
  }, [id, usuario?.id, usuario?.papel])

  const perguntar = async (e) => {
    e.preventDefault()
    if (!pergunta.trim()) return

    const textoDaPergunta = pergunta.trim()
    setPergunta('')
    setErroChat('')
    setPerguntando(true)
    setConversa((anterior) => [...anterior, { autor: 'usuario', texto: textoDaPergunta }])

    try {
      const resposta = await iaApi.post('/perguntar', {
        pergunta: textoDaPergunta,
        resultado: analise.resultado,
      })
      setConversa((anterior) => [...anterior, { autor: 'ia', texto: resposta.data.resposta }])
    } catch (error) {
      console.error('Não foi possível responder a pergunta.', error)
      setErroChat(error.response?.data?.erro || 'Não foi possível responder agora. Tente novamente.')
    } finally {
      setPerguntando(false)
    }
  }

  const Sidebar = usuario?.papel === 'gestor' ? SidebarGestor : SidebarOperador

  if (carregando || erro || !analise) {
    return (
      <div className="app-shell d-flex flex-column flex-md-row">
        <Sidebar />
        <main className="app-main flex-grow-1">
          <div className="content-card card shadow-sm"><div className="card-body">
            {carregando ? <p className="mb-0">Carregando análise...</p> : (
              <>
                <p className="text-danger">{erro}</p>
                <Link to="/analises" className="btn btn-outline-primary">Voltar ao histórico</Link>
              </>
            )}
          </div></div>
        </main>
      </div>
    )
  }

  const { resultado = {}, serieTemporal = [], fontes = [] } = analise
  const resumo = resultado.resumo || {}
  const diagnostico = resultado.diagnostico || {}
  const indicadores = comoLista(resultado.indicadores)
  const gargalos = comoLista(resultado.gargalos)
  const oportunidades = comoLista(resultado.oportunidades)
  const planoDeAcao = comoLista(resultado.planoDeAcao)
  const limitacoes = comoLista(resultado.limitacoes)
  const previsao = preverTendencia(serieTemporal)
  const score = Number(diagnostico.scoreSaude) || 0

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <Sidebar />

      <main className="app-main flex-grow-1">
        <CredentialUser title={analise.titulo} />

        <ul className="nav nav-tabs flex-nowrap overflow-auto mb-4" role="tablist">
          {ABAS.map((aba) => (
            <li className="nav-item" key={aba.id}>
              <button
                type="button"
                className={`nav-link text-nowrap ${abaAtiva === aba.id ? 'active' : ''}`}
                onClick={() => setAbaAtiva(aba.id)}
                role="tab"
                aria-selected={abaAtiva === aba.id}
              >
                {aba.rotulo}
              </button>
            </li>
          ))}
        </ul>

        {abaAtiva === 'resumo' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5">{resumo.titulo || 'Resumo indisponível'}</h2>
              {resumo.periodo && <p className="text-muted small mb-2">Período analisado: {resumo.periodo}</p>}
              <p>{resumo.visaoGeral || 'Esta análise não possui um resumo disponível.'}</p>

              <div className="row">
                {indicadores.map((indicador, indice) => (
                  <div className="col-6 col-md-3 mb-3" key={`${indicador.nome}-${indice}`}>
                    <div className={styles.indicador}>
                      <div className="text-muted small">{indicador.nome}</div>
                      <div className="h5 mb-1">{formatarNumero(indicador.valor)} {indicador.unidade}</div>
                      <span className={`badge ${corSituacao[indicador.situacao] || corTendencia[indicador.tendencia] || 'bg-secondary'}`}>
                        {indicador.tendencia || indicador.situacao || '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {indicadores.length === 0 && <p className="text-muted">Nenhum indicador foi retornado para esta análise.</p>}

              <h3 className="h6 mt-3">Destaques</h3>
              <ul className="mb-0">
                {comoLista(resumo.destaques).map((destaque, i) => <li key={i}>{destaque}</li>)}
              </ul>

              {fontes.length > 0 && (
                <>
                  <h3 className="h6 mt-4">Fontes analisadas</h3>
                  <ul className="mb-0 text-muted small">
                    {fontes.map((fonte, i) => <li key={i}>{fonte}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'dashboard' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <Grafico
                serie={serieTemporal}
                previstos={previsao.valoresPrevistos}
                titulo="Evolução do indicador principal"
              />

              <div className="row mt-4">
                {indicadores.map((indicador, indice) => (
                  <div className="col-6 col-md-3 mb-3" key={`${indicador.nome}-${indice}`}>
                    <div className={styles.indicador}>
                      <div className="text-muted small">{indicador.nome}</div>
                      <div className="h5 mb-0">{formatarNumero(indicador.valor)} {indicador.unidade}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-muted small mb-0">
                Gráfico e previsão são calculados pela própria plataforma a partir da série
                numérica encontrada nos arquivos — sem passar pela IA.
              </p>
            </div>
          </div>
        )}

        {abaAtiva === 'diagnostico' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className={styles.score} style={{ borderColor: corDoScore(score) }}>
                  <strong style={{ color: corDoScore(score) }}>{score}</strong>
                  <small>/100</small>
                </div>
                <div>
                  <h2 className="h6 mb-1">Score de saúde operacional</h2>
                  <p className="text-muted small mb-0">Avaliação geral calculada pela IA sobre os dados enviados.</p>
                </div>
              </div>

              <p>{diagnostico.avaliacaoGeral || 'Diagnóstico indisponível para esta análise.'}</p>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <h3 className="h6">Fatos observados</h3>
                  <ul className="mb-0">
                    {comoLista(diagnostico.fatosObservados).map((fato, i) => <li key={i}>{fato}</li>)}
                  </ul>
                  {comoLista(diagnostico.fatosObservados).length === 0 && <p className="text-muted mb-0">—</p>}
                </div>
                <div className="col-md-6 mb-3">
                  <h3 className="h6">Hipóteses</h3>
                  <ul className="mb-0">
                    {comoLista(diagnostico.hipoteses).map((hipotese, i) => <li key={i}>{hipotese}</li>)}
                  </ul>
                  {comoLista(diagnostico.hipoteses).length === 0 && <p className="text-muted mb-0">—</p>}
                </div>
              </div>

              {limitacoes.length > 0 && (
                <div className="alert alert-secondary mb-0 mt-2">
                  <h3 className="h6">O que esta análise não permite concluir</h3>
                  <ul className="mb-0 small">
                    {limitacoes.map((limitacao, i) => <li key={i}>{limitacao}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'gargalos' && (
          <div className="card shadow-sm">
            <div className="card-body">
              {gargalos.map((gargalo, i) => (
                <div key={`${gargalo.titulo}-${i}`} className={i < gargalos.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h3 className="h6 mb-1">{gargalo.titulo}</h3>
                    <span className={`badge ${corSeveridade[gargalo.severidade] || 'bg-secondary'} text-capitalize`}>
                      {gargalo.severidade}
                    </span>
                  </div>
                  <p className="mb-2 text-muted">{gargalo.descricao}</p>
                  {gargalo.evidencia && <p className="mb-1 small"><strong>Evidência:</strong> {gargalo.evidencia}</p>}
                  {gargalo.impacto && <p className="mb-0 small"><strong>Impacto:</strong> {gargalo.impacto}</p>}
                </div>
              ))}
              {gargalos.length === 0 && <p className="text-muted mb-0">Nenhum gargalo foi identificado nesta análise.</p>}
            </div>
          </div>
        )}

        {abaAtiva === 'oportunidades' && (
          <div className="card shadow-sm">
            <div className="card-body">
              {oportunidades.map((oportunidade, i) => (
                <div key={`${oportunidade.titulo}-${i}`} className={i < oportunidades.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h3 className="h6 mb-1">{oportunidade.titulo}</h3>
                    <span className={`badge ${corEsforco[oportunidade.esforco] || 'bg-secondary'}`}>
                      esforço {oportunidade.esforco}
                    </span>
                  </div>
                  <p className="mb-2 text-muted">{oportunidade.descricao}</p>
                  {oportunidade.impactoPotencial && (
                    <p className="mb-0 small"><strong>Impacto potencial:</strong> {oportunidade.impactoPotencial}</p>
                  )}
                </div>
              ))}
              {oportunidades.length === 0 && <p className="text-muted mb-0">Nenhuma oportunidade foi identificada nesta análise.</p>}
            </div>
          </div>
        )}

        {abaAtiva === 'planoDeAcao' && (
          <div className="card shadow-sm">
            <div className="card-body">
              {planoDeAcao.map((item, i) => (
                <div key={`${item.titulo}-${i}`} className={i < planoDeAcao.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h3 className="h6 mb-1">{item.titulo}</h3>
                    <span className={`badge ${corPrioridade[item.prioridade] || 'bg-secondary'} text-capitalize`}>
                      {item.prioridade}
                    </span>
                  </div>
                  <p className="mb-2 text-muted">{item.descricao}</p>
                  <p className="mb-0 small text-muted">
                    {item.prazo && <><strong>Prazo:</strong> {item.prazo}</>}
                    {item.prazo && item.resultadoEsperado && ' · '}
                    {item.resultadoEsperado && <><strong>Resultado esperado:</strong> {item.resultadoEsperado}</>}
                  </p>
                </div>
              ))}
              {planoDeAcao.length === 0 && <p className="text-muted mb-0">Nenhuma ação foi sugerida para esta análise.</p>}
            </div>
          </div>
        )}

        {abaAtiva === 'previsao' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-2">Método: {previsao.metodo}</p>
              <p>Tendência prevista: <strong className="text-capitalize">{previsao.tendencia}</strong></p>

              {previsao.valoresPrevistos.length > 0 ? (
                <>
                  <Grafico serie={serieTemporal} previstos={previsao.valoresPrevistos} />
                  <p className="mb-2 mt-4">Próximos períodos (com base na série enviada):</p>
                  <ul className="mb-0">
                    {previsao.valoresPrevistos.map((valor, i) => (
                      <li key={i}>Período {serieTemporal.length + i + 1}: {valor}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted mb-0">Dados insuficientes para calcular uma previsão.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'chat' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6">Pergunte sobre esta análise</h2>
              <p className="text-muted small">
                As respostas usam apenas o que está nesta análise — a IA não consulta os arquivos de novo.
              </p>

              <div className={styles.conversa}>
                {conversa.length === 0 && (
                  <p className="text-muted small mb-0">
                    Ex: &quot;qual foi o maior gargalo?&quot; ou &quot;por onde eu começo o plano de ação?&quot;
                  </p>
                )}
                {conversa.map((mensagem, i) => (
                  <div
                    key={i}
                    className={`${styles.mensagem} ${mensagem.autor === 'usuario' ? styles.doUsuario : styles.daIa}`}
                  >
                    {mensagem.texto}
                  </div>
                ))}
                {perguntando && <p className="text-muted small mb-0">Pilô está pensando...</p>}
              </div>

              {erroChat && <div className="alert alert-danger py-2" role="alert">{erroChat}</div>}

              <form className="d-flex gap-2" onSubmit={perguntar}>
                <input
                  className="form-control"
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  placeholder="Escreva sua pergunta"
                  aria-label="Pergunta sobre a análise"
                />
                <button type="submit" className="btn btn-primary" disabled={perguntando || !pergunta.trim()}>
                  Enviar
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DetalheAnalise
