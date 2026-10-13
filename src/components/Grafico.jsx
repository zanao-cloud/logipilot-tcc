import styles from './Grafico.module.css'

const formatarValor = (valor) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)

/**
 * Gráfico de barras montado em SVG, sem biblioteca externa.
 * Recebe a série detectada nos arquivos ([{ rotulo, valor }]) e, opcionalmente,
 * os valores previstos, que aparecem em tom mais claro ao final.
 */
const Grafico = ({ serie = [], previstos = [], titulo }) => {
  const pontos = [
    ...serie.map((ponto) => ({ ...ponto, previsto: false })),
    ...previstos.map((valor, indice) => ({
      rotulo: `+${indice + 1}`,
      valor,
      previsto: true,
    })),
  ]

  if (pontos.length < 2) {
    return <p className="text-muted mb-0">Dados insuficientes para montar o gráfico.</p>
  }

  const valores = pontos.map((ponto) => ponto.valor)
  const maior = Math.max(...valores)
  const menor = Math.min(...valores, 0)
  const intervalo = maior - menor || 1

  // Com muitos períodos não cabe um rótulo por barra: mostramos no máximo 6,
  // distribuídos ao longo do eixo, para cada um ter largura suficiente.
  const MAXIMO_DE_ROTULOS = 6
  const passo = Math.max(Math.ceil(pontos.length / MAXIMO_DE_ROTULOS), 1)
  const rotulos = pontos.filter((_, indice) => indice % passo === 0).map((ponto) => ponto.rotulo)

  return (
    <figure className={styles.grafico}>
      {titulo && <figcaption className={styles.titulo}>{titulo}</figcaption>}

      <div className={styles.area}>
        <div className={styles.eixoY}>
          <span>{formatarValor(maior)}</span>
          <span>{formatarValor(menor + intervalo / 2)}</span>
          <span>{formatarValor(menor)}</span>
        </div>

        <div className={styles.barras} role="img" aria-label={`Gráfico de ${pontos.length} períodos`}>
          {pontos.map((ponto, indice) => (
            <div
              key={`${ponto.rotulo}-${indice}`}
              className={styles.coluna}
              title={`${ponto.rotulo}: ${formatarValor(ponto.valor)}${ponto.previsto ? ' (previsto)' : ''}`}
            >
              <div
                className={`${styles.barra} ${ponto.previsto ? styles.previsto : ''}`}
                style={{ height: `${Math.max(((ponto.valor - menor) / intervalo) * 100, 2)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.eixoX}>
        {rotulos.map((rotulo, indice) => (
          <span key={`${rotulo}-${indice}`} className={styles.rotulo} title={rotulo}>
            {rotulo}
          </span>
        ))}
      </div>

      {previstos.length > 0 && (
        <p className={styles.legenda}>
          <span className={styles.amostra} />
          Períodos realizados
          <span className={`${styles.amostra} ${styles.amostraPrevista}`} />
          Previsão da plataforma
        </p>
      )}
    </figure>
  )
}

export default Grafico
