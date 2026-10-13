import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import iaApi from '../../services/iaApi'
import { getUsuarioLogado, logout } from '../../services/sessao'
import { formatarData } from '../../services/formatadores'
import { formatarPlaca } from '../../services/formatos'
import LeitorDeCodigo from '../../components/LeitorDeCodigo'
import {
  calcularKpis,
  foiConcluida,
  foiConferida,
  foiPontual,
  hojeISO,
  horaDaConclusao,
  linkDoMapa,
  ordenarEntregas,
  statusInfo,
  urlDoComprovante,
} from '../../services/entregas'
import styles from './HomeMotorista.module.css'

const HomeMotorista = () => {
  const usuario = getUsuarioLogado()
  const usuarioId = usuario?.id
  const navigate = useNavigate()

  const [entregas, setEntregas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [registrando, setRegistrando] = useState(null)
  const [erroRegistro, setErroRegistro] = useState('')
  const [desfecho, setDesfecho] = useState('entregue')
  const [observacoes, setObservacoes] = useState('')
  const [recebidoPor, setRecebidoPor] = useState('')
  const [comprovante, setComprovante] = useState(null)
  const [lendoCodigo, setLendoCodigo] = useState(false)
  const [avisoDaLeitura, setAvisoDaLeitura] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [otimizando, setOtimizando] = useState(false)
  const [rota, setRota] = useState(null)

  const data = hojeISO()

  useEffect(() => {
    if (!usuarioId) return

    api
      .get('/entregas', { params: { motoristaId: String(usuarioId) } })
      .then((resposta) => {
        // A filtragem é refeita aqui porque o back-end fake pode devolver
        // a coleção inteira quando o filtro não é aplicado.
        const minhas = resposta.data.filter(
          (entrega) => String(entrega.motoristaId) === String(usuarioId) && entrega.data === data,
        )
        setEntregas(ordenarEntregas(minhas))
      })
      .catch((error) => {
        console.error('Erro ao carregar as entregas.', error)
        setErro('Não foi possível carregar suas entregas agora.')
      })
      .finally(() => setCarregando(false))
  }, [usuarioId, data])

  const sair = () => {
    logout()
    navigate('/login')
  }

  const abrirRegistro = (entrega) => {
    setRegistrando(entrega.id)
    setDesfecho('entregue')
    setObservacoes('')
    setRecebidoPor('')
    setComprovante(null)
    setErroRegistro('')
  }

  /** Conferência de carga: marca ou desmarca que o pacote foi posto na van. */
  const alternarConferencia = async (entrega) => {
    const conferida = !foiConferida(entrega)

    try {
      const { data } = await api.patch(`/entregas/${entrega.id}`, { conferida })
      setEntregas((atuais) => atuais.map((e) => (e.id === entrega.id ? data : e)))
    } catch (error) {
      console.error('Não foi possível atualizar a conferência.', error)
      setErro('Não foi possível atualizar a conferência de carga.')
    }
  }

  /**
   * Código lido pela câmera (ou digitado): encontra a parada daquele pacote e
   * marca a conferência. Código que não é da rota do dia vira aviso.
   */
  const conferirPorCodigo = async (codigo) => {
    const alvo = entregas.find(
      (entrega) => entrega.codigo?.toUpperCase() === codigo.toUpperCase(),
    )

    setLendoCodigo(false)

    if (!alvo) {
      setAvisoDaLeitura(`O pacote ${codigo.toUpperCase()} não está na sua rota de hoje.`)
      return
    }

    if (foiConferida(alvo)) {
      setAvisoDaLeitura(`O pacote ${alvo.codigo} já estava conferido.`)
      return
    }

    await alternarConferencia(alvo)
    setAvisoDaLeitura(`Pacote ${alvo.codigo} conferido — ${alvo.cliente}.`)
  }

  const registrarEntrega = async (entrega) => {
    if (desfecho === 'ausente' && !observacoes.trim()) {
      setErroRegistro('Descreva o que aconteceu no local antes de registrar a ausência.')
      return
    }

    setSalvando(true)
    setErroRegistro('')

    try {
      const { data } = await api.patch(`/entregas/${entrega.id}`, {
        status: desfecho,
        observacoes: observacoes.trim(),
        recebidoPor: desfecho === 'entregue' ? recebidoPor.trim() : null,
        concluidaEm: new Date().toISOString(),
      })

      let atualizada = data

      // A foto vai numa segunda chamada, porque é multipart e não JSON.
      if (desfecho === 'entregue' && comprovante) {
        const envio = new FormData()
        envio.append('arquivo', comprovante)
        const resposta = await api.post(`/entregas/${entrega.id}/comprovante`, envio)
        atualizada = resposta.data
      }

      setEntregas((atuais) => atuais.map((e) => (e.id === entrega.id ? atualizada : e)))
      setRegistrando(null)
      setObservacoes('')
      setRecebidoPor('')
      setComprovante(null)
    } catch (error) {
      console.error('Não foi possível registrar a entrega.', error)
      setErroRegistro(
        error.response?.data?.erro || 'Não foi possível registrar a entrega. Tente novamente.',
      )
    } finally {
      setSalvando(false)
    }
  }

  const reabrirEntrega = async (entrega) => {
    const reaberta = { status: 'pendente', observacoes: '', concluidaEm: null }

    try {
      await api.patch(`/entregas/${entrega.id}`, reaberta)
      setEntregas((atuais) => atuais.map((e) => (e.id === entrega.id ? { ...e, ...reaberta } : e)))
    } catch (error) {
      console.error('Não foi possível reabrir a entrega.', error)
      setErro('Não foi possível reabrir a entrega.')
    }
  }

  /**
   * Manda os endereços pendentes para a IA e grava a sequência sugerida.
   * As entregas já registradas ficam no topo, na ordem em que aconteceram.
   */
  const otimizarEntregas = async () => {
    const pendentes = entregas.filter((entrega) => !foiConcluida(entrega))

    if (pendentes.length < 2) {
      setErro('É preciso ter pelo menos duas entregas pendentes para otimizar a rota.')
      return
    }

    setOtimizando(true)
    setErro('')
    setRota(null)

    try {
      const resposta = await iaApi.post('/otimizar-rota', {
        motorista: usuario?.nome || '',
        entregas: pendentes.map((entrega) => ({
          id: entrega.id,
          cliente: entrega.cliente,
          endereco: entrega.endereco,
          cidade: entrega.cidade,
          janelaInicio: entrega.janelaInicio,
          janelaFim: entrega.janelaFim,
          distanciaKm: entrega.distanciaKm,
          prioridade: entrega.prioridade,
        })),
      })

      const sequencia = resposta.data.ordem || []
      const pendentesOrdenadas = sequencia
        .map((idEntrega) => pendentes.find((entrega) => String(entrega.id) === String(idEntrega)))
        .filter(Boolean)

      // Qualquer entrega que a IA tenha deixado de fora continua na rota, no fim.
      const faltantes = pendentes.filter((entrega) => !pendentesOrdenadas.includes(entrega))
      const concluidas = entregas.filter(foiConcluida)
      const novaOrdem = [...concluidas, ...pendentesOrdenadas, ...faltantes]

      await Promise.all(
        novaOrdem.map((entrega, indice) => api.patch(`/entregas/${entrega.id}`, { ordem: indice + 1 })),
      )

      setEntregas(novaOrdem.map((entrega, indice) => ({ ...entrega, ordem: indice + 1 })))
      setRota({
        justificativa: resposta.data.justificativa || '',
        paradas: resposta.data.paradas || [],
        origem: resposta.data.origem || 'ia',
      })
    } catch (error) {
      console.error('Não foi possível otimizar a rota.', error)
      setErro(
        error.code === 'ERR_NETWORK'
          ? 'O servidor de otimização não respondeu. Verifique se ele está rodando (npm run ia).'
          : 'Não foi possível otimizar a rota agora. Tente novamente.',
      )
    } finally {
      setOtimizando(false)
    }
  }

  const kpis = calcularKpis(entregas)
  const pendentes = entregas.filter((entrega) => !foiConcluida(entrega))
  const proxima = pendentes[0]

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
        <div className={styles.identificacao}>
          <span className={styles.nome}>{usuario ? usuario.nome : 'Motorista'}</span>
          <span className={styles.placa}>{usuario?.placa ? `Placa ${formatarPlaca(usuario.placa)}` : 'Sem veículo'}</span>
        </div>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={sair}>
          <i className="fas fa-sign-out-alt me-1"></i>Sair
        </button>
      </header>

      <main className={styles.conteudo}>
        <div className={styles.saudacao}>
          <div>
            <h1 className="h5 mb-1">Olá, {usuario ? usuario.nome.split(' ')[0] : 'Motorista'}!</h1>
            <p className="text-muted small mb-0 text-capitalize">{formatarData(data)}</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={otimizarEntregas}
            disabled={otimizando || pendentes.length < 2}
            title={pendentes.length < 2 ? 'Precisa de duas ou mais entregas pendentes' : 'Ordenar a rota com a IA'}
          >
            <i className={`fas ${otimizando ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} me-2`}></i>
            {otimizando ? 'Otimizando...' : 'Otimizar entregas'}
          </button>
        </div>

        {erro && <div className="alert alert-warning py-2" role="alert">{erro}</div>}

        {carregando && <p className="text-muted">Carregando suas entregas...</p>}

        {!carregando && entregas.length === 0 && (
          <div className={styles.vazio}>
            <i className="fas fa-clipboard-list"></i>
            <h2 className="h6 mb-1">Nenhuma entrega designada</h2>
            <p className="text-muted small mb-0">
              Sua rota de hoje ainda está vazia. O operador designa as entregas em
              Motoristas → Designar entregas e elas aparecem aqui.
            </p>
          </div>
        )}

        {!carregando && entregas.length > 0 && (
          <>
            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <span className={styles.kpiValor}>{kpis.concluidas}<small>/{kpis.total}</small></span>
                <span className={styles.kpiRotulo}>Entregas registradas</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiValor}>
                  {kpis.pontualidade === null ? '—' : `${kpis.pontualidade}%`}
                </span>
                <span className={styles.kpiRotulo}>
                  Pontualidade {kpis.entregues > 0 && `(${kpis.noPrazo}/${kpis.entregues} na janela)`}
                </span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiValor}>{kpis.kmRodados}<small> km</small></span>
                <span className={styles.kpiRotulo}>Rodados de {kpis.kmPlanejados} km previstos</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiValor}>{kpis.pendentes}</span>
                <span className={styles.kpiRotulo}>
                  Entregas pendentes{kpis.ausentes > 0 && ` · ${kpis.ausentes} sem ninguém no local`}
                </span>
              </div>
            </div>

            {kpis.pendentes > 0 && (
              <div className={`${styles.conferencia} ${kpis.aConferir === 0 ? styles.conferenciaOk : ''}`}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <strong className="small">
                    <i className={`fas ${kpis.aConferir === 0 ? 'fa-circle-check' : 'fa-dolly'} me-1`}></i>
                    Conferência de carga — {kpis.conferidas} de {kpis.pendentes} pacote(s) na van
                  </strong>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setLendoCodigo(true)}>
                    <i className="fas fa-qrcode me-1"></i>Bipar pacote
                  </button>
                </div>

                {kpis.aConferir === 0 ? (
                  <p className="small mb-0 text-success-emphasis">
                    Tudo carregado. Pode sair para a rota.
                  </p>
                ) : (
                  <>
                    <p className="small text-muted mb-2">
                      Marque cada caixa ao colocar na van. Faltam {kpis.aConferir}.
                    </p>
                    <ul className={styles.listaConferencia}>
                      {pendentes.map((entrega) => (
                        <li key={entrega.id}>
                          <label className={`${styles.itemConferencia} ${foiConferida(entrega) ? styles.itemConferido : ''}`}>
                            <input
                              type="checkbox"
                              checked={foiConferida(entrega)}
                              onChange={() => alternarConferencia(entrega)}
                            />
                            <span className={styles.codigo}>{entrega.codigo}</span>
                            <span className="small text-truncate">{entrega.cliente}</span>
                            <span className="small text-muted ms-auto flex-shrink-0">
                              {entrega.volumes} vol.
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {avisoDaLeitura && (
                  <div className="alert alert-info py-2 small mt-2 mb-0" role="status">
                    {avisoDaLeitura}
                    <button
                      type="button"
                      className="btn-close btn-sm float-end"
                      aria-label="Fechar aviso"
                      onClick={() => setAvisoDaLeitura('')}
                    ></button>
                  </div>
                )}
              </div>
            )}

            <div className={styles.progresso}>
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold">Progresso do dia</span>
                <span className="text-muted">{kpis.progresso}%</span>
              </div>
              <div className="progress" role="progressbar" aria-label="Progresso das entregas do dia" aria-valuenow={kpis.progresso} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar bg-success" style={{ width: `${kpis.progresso}%` }}></div>
              </div>
            </div>

            {proxima && (
              <div className={styles.proxima}>
                <div>
                  <span className="badge bg-primary mb-2">Próxima parada</span>
                  <div className={styles.codigoDestaque}>
                    {proxima.codigo}
                    <span className={styles.volumes}>
                      {proxima.volumes} {proxima.volumes > 1 ? 'volumes' : 'volume'}
                    </span>
                  </div>
                  <div className="fw-bold">{proxima.cliente}</div>
                  <div className="small text-muted">{proxima.endereco} · {proxima.cidade}</div>
                  <div className="small text-muted">Janela {proxima.janelaInicio}–{proxima.janelaFim} · {proxima.distanciaKm} km</div>
                </div>
                <a className="btn btn-sm btn-outline-primary" href={linkDoMapa(proxima)} target="_blank" rel="noreferrer">
                  <i className="fas fa-location-arrow me-1"></i>Abrir no mapa
                </a>
              </div>
            )}

            {rota && (
              <div className={styles.rota}>
                <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                  <strong className="small">
                    <i className="fas fa-route me-1"></i>
                    Rota reordenada {rota.origem === 'local' ? '(sequência calculada no servidor, sem IA)' : 'pela IA'}
                  </strong>
                  <button type="button" className="btn-close btn-sm" aria-label="Fechar sugestão" onClick={() => setRota(null)}></button>
                </div>
                {rota.justificativa && <p className="small mb-0">{rota.justificativa}</p>}
              </div>
            )}

            <h2 className="h6 mb-2">Entregas do dia</h2>
            <ul className={styles.lista}>
              {entregas.map((entrega, indice) => {
                const info = statusInfo(entrega.status)
                const concluida = foiConcluida(entrega)

                return (
                  <li key={entrega.id} className={`${styles.entrega} ${concluida ? styles.entregaConcluida : ''}`}>
                    <div className={styles.linhaTopo}>
                      <div className={`${styles.ordem} ${concluida ? styles.ordemFeita : ''}`}>
                        {concluida ? <i className="fas fa-check"></i> : indice + 1}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className={styles.codigo}>{entrega.codigo}</span>
                          <span className="fw-bold">{entrega.cliente}</span>
                          <span className={`badge ${info.cor}`}>{info.rotulo}</span>
                          {entrega.prioridade === 'alta' && !concluida && (
                            <span className="badge bg-danger">Prioridade alta</span>
                          )}
                          {entrega.status === 'entregue' && (
                            <span className={`badge ${foiPontual(entrega) ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {foiPontual(entrega) ? 'No prazo' : 'Fora da janela'}
                            </span>
                          )}
                        </div>
                        <div className="small text-muted">{entrega.endereco} · {entrega.cidade}</div>
                        <div className="small text-muted">
                          <i className="fas fa-box me-1"></i>{entrega.volumes} {entrega.volumes > 1 ? 'volumes' : 'volume'}
                          <span className="mx-2">·</span>
                          <i className="fas fa-clock me-1"></i>{entrega.janelaInicio}–{entrega.janelaFim}
                          <span className="mx-2">·</span>
                          <i className="fas fa-road me-1"></i>{entrega.distanciaKm} km
                          {concluida && horaDaConclusao(entrega) && (
                            <>
                              <span className="mx-2">·</span>
                              <i className="fas fa-circle-check me-1"></i>registrada às {horaDaConclusao(entrega)}
                            </>
                          )}
                        </div>
                        {entrega.observacoesOperador && (
                          <div className={styles.instrucao}>
                            <i className="fas fa-circle-info me-1"></i>{entrega.observacoesOperador}
                          </div>
                        )}
                        {entrega.recebidoPor && (
                          <div className={styles.observacao}>
                            <i className="fas fa-signature me-1"></i>Recebido por {entrega.recebidoPor}
                          </div>
                        )}
                        {entrega.observacoes && (
                          <div className={styles.observacao}>
                            <i className="fas fa-comment-dots me-1"></i>{entrega.observacoes}
                          </div>
                        )}
                        {entrega.temComprovante && (
                          <a
                            className={styles.observacao}
                            href={urlDoComprovante(entrega)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <i className="fas fa-image me-1"></i>Ver foto do comprovante
                          </a>
                        )}
                      </div>
                    </div>

                    <div className={styles.acoes}>
                      <a className="btn btn-sm btn-outline-secondary" href={linkDoMapa(entrega)} target="_blank" rel="noreferrer">
                        <i className="fas fa-map-location-dot me-1"></i>Mapa
                      </a>

                      {!concluida && registrando !== entrega.id && (
                        <button type="button" className="btn btn-sm btn-success" onClick={() => abrirRegistro(entrega)}>
                          <i className="fas fa-clipboard-check me-1"></i>Registrar entrega
                        </button>
                      )}

                      {concluida && (
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => reabrirEntrega(entrega)}>
                          <i className="fas fa-rotate-left me-1"></i>Desfazer
                        </button>
                      )}
                    </div>

                    {registrando === entrega.id && (
                      <div className={styles.registro}>
                        <span className="small fw-semibold d-block mb-2">
                          O que aconteceu com o pacote <span className={styles.codigo}>{entrega.codigo}</span>?
                        </span>

                        <div className={styles.desfechos}>
                          <label className={`${styles.desfecho} ${desfecho === 'entregue' ? styles.desfechoAtivo : ''}`}>
                            <input
                              type="radio"
                              name={`desfecho-${entrega.id}`}
                              value="entregue"
                              checked={desfecho === 'entregue'}
                              onChange={(e) => { setDesfecho(e.target.value); setErroRegistro('') }}
                            />
                            <i className="fas fa-circle-check me-2"></i>Entregue
                          </label>
                          <label className={`${styles.desfecho} ${desfecho === 'ausente' ? styles.desfechoAtivo : ''}`}>
                            <input
                              type="radio"
                              name={`desfecho-${entrega.id}`}
                              value="ausente"
                              checked={desfecho === 'ausente'}
                              onChange={(e) => { setDesfecho(e.target.value); setErroRegistro('') }}
                            />
                            <i className="fas fa-house-circle-xmark me-2"></i>Não havia ninguém no local
                          </label>
                        </div>

                        {desfecho === 'entregue' && (
                          <div className={styles.comprovante}>
                            <label className="form-label small mt-3" htmlFor={`recebido-${entrega.id}`}>
                              Quem recebeu
                            </label>
                            <input
                              id={`recebido-${entrega.id}`}
                              className="form-control"
                              value={recebidoPor}
                              onChange={(e) => setRecebidoPor(e.target.value)}
                              placeholder="Nome de quem assinou"
                              autoComplete="off"
                            />

                            <label className="form-label small mt-3" htmlFor={`foto-${entrega.id}`}>
                              Foto do comprovante
                            </label>
                            <input
                              id={`foto-${entrega.id}`}
                              type="file"
                              className="form-control"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                            />
                            <div className="form-text">
                              Canhoto assinado ou a fachada do local. Opcional, mas evita discussão depois.
                            </div>
                          </div>
                        )}

                        <label className="form-label small mt-3" htmlFor={`obs-${entrega.id}`}>
                          Observações {desfecho === 'ausente' && <span className="text-danger">(obrigatório)</span>}
                        </label>
                        <textarea
                          id={`obs-${entrega.id}`}
                          className="form-control"
                          rows={2}
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder={desfecho === 'ausente'
                            ? 'Ex: estabelecimento fechado, toquei a campainha duas vezes às 10h20.'
                            : 'Ex: recebido pelo gerente, carga conferida.'}
                        />

                        {erroRegistro && (
                          <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">{erroRegistro}</div>
                        )}

                        <div className="d-flex gap-2 mt-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => registrarEntrega(entrega)}
                            disabled={salvando}
                          >
                            {salvando ? 'Salvando...' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => { setRegistrando(null); setErroRegistro('') }}
                            disabled={salvando}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </main>

      {lendoCodigo && (
        <LeitorDeCodigo onLer={conferirPorCodigo} onFechar={() => setLendoCodigo(false)} />
      )}
    </div>
  )
}

export default HomeMotorista
