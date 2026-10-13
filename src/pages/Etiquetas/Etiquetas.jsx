import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import api from '../../services/api'
import { formatarData } from '../../services/formatadores'
import { hojeISO, ordenarEntregas } from '../../services/entregas'
import styles from './Etiquetas.module.css'

/**
 * Folha de etiquetas para colar nas caixas. O QR carrega o próprio código do
 * pacote, que é o mesmo que o motorista lê no aplicativo ao conferir a carga.
 */
const Etiquetas = () => {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const data = parametros.get('data') || hojeISO()

  const [motorista, setMotorista] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [qrs, setQrs] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/usuarios/${id}`),
      api.get('/entregas', { params: { motoristaId: id, data } }),
    ])
      .then(async ([respostaMotorista, respostaEntregas]) => {
        const doDia = ordenarEntregas(respostaEntregas.data)
        setMotorista(respostaMotorista.data)
        setEntregas(doDia)

        // Cada QR vira um data URL, então a folha imprime sem depender da rede.
        const gerados = await Promise.all(doDia.map(async (entrega) => [
          entrega.id,
          await QRCode.toDataURL(entrega.codigo, { margin: 1, width: 240 }),
        ]))

        setQrs(Object.fromEntries(gerados))
      })
      .catch((error) => {
        console.error('Erro ao montar as etiquetas.', error)
        setErro('Não foi possível carregar as etiquetas desta rota.')
      })
      .finally(() => setCarregando(false))
  }, [id, data])

  return (
    <div className={styles.pagina}>
      <div className={styles.barra}>
        <div>
          <h1 className="h6 mb-1">
            Etiquetas · {motorista ? motorista.nome : 'carregando'} · {formatarData(data)}
          </h1>
          <p className="small text-muted mb-0">
            {entregas.length} etiqueta(s). Imprima, recorte e cole em cada caixa.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/operador/motoristas/${id}`} className="btn btn-sm btn-outline-primary">
            <i className="fas fa-arrow-left me-1"></i>Voltar
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => window.print()}
            disabled={entregas.length === 0}
          >
            <i className="fas fa-print me-1"></i>Imprimir
          </button>
        </div>
      </div>

      {erro && <div className="alert alert-danger m-3" role="alert">{erro}</div>}
      {carregando && <p className="text-muted m-3">Gerando etiquetas...</p>}

      {!carregando && entregas.length === 0 && (
        <p className="text-muted m-3">Nenhuma entrega designada nesta data.</p>
      )}

      <div className={styles.folha}>
        {entregas.map((entrega, indice) => (
          <div key={entrega.id} className={styles.etiqueta}>
            <div className={styles.cabecalho}>
              <span className={styles.ordem}>Parada {indice + 1}</span>
              <span className={styles.volumes}>{entrega.volumes} vol.</span>
            </div>

            <div className={styles.corpo}>
              {qrs[entrega.id] && <img src={qrs[entrega.id]} alt={`QR do pacote ${entrega.codigo}`} className={styles.qr} />}
              <div className={styles.dados}>
                <div className={styles.codigo}>{entrega.codigo}</div>
                <div className={styles.cliente}>{entrega.cliente}</div>
                <div className={styles.endereco}>{entrega.endereco}</div>
                <div className={styles.endereco}>{entrega.cidade}</div>
                <div className={styles.janela}>
                  Janela {entrega.janelaInicio}–{entrega.janelaFim}
                  {entrega.prioridade === 'alta' && ' · PRIORIDADE ALTA'}
                </div>
              </div>
            </div>

            <div className={styles.rodape}>
              {motorista ? motorista.nome : ''} · {formatarData(entrega.data)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Etiquetas
