const calcularRegressaoLinear = (serie) => {
  const n = serie.length
  const somaX = serie.reduce((soma, _, i) => soma + i, 0)
  const somaY = serie.reduce((soma, valor) => soma + valor, 0)
  const somaXY = serie.reduce((soma, valor, i) => soma + i * valor, 0)
  const somaX2 = serie.reduce((soma, _, i) => soma + i * i, 0)

  const inclinacao = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX)
  const intercepto = (somaY - inclinacao * somaX) / n

  return { inclinacao, intercepto }
}

const calcularMediaMovel = (serie, janela = 3) => {
  const ultimos = serie.slice(-janela)
  return ultimos.reduce((soma, valor) => soma + valor, 0) / ultimos.length
}

// Previsão simples (sem IA): mistura regressão linear com média móvel,
// igual em espírito ao motor de previsão do LogiPilot original.
export const preverTendencia = (serie, quantidadePeriodos = 3) => {
  if (!serie || serie.length < 2) {
    return { metodo: 'indisponível', tendencia: 'estavel', valoresPrevistos: [] }
  }

  const { inclinacao, intercepto } = calcularRegressaoLinear(serie)
  const mediaMovelAtual = calcularMediaMovel(serie)

  const valoresPrevistos = []
  for (let i = 0; i < quantidadePeriodos; i++) {
    const x = serie.length + i
    const valorRegressao = intercepto + inclinacao * x
    const valorPrevisto = (valorRegressao + mediaMovelAtual) / 2
    valoresPrevistos.push(Number(valorPrevisto.toFixed(1)))
  }

  const variacaoPercentual = (inclinacao / (mediaMovelAtual || 1)) * 100
  let tendencia = 'estavel'
  if (variacaoPercentual > 2) tendencia = 'alta'
  if (variacaoPercentual < -2) tendencia = 'baixa'

  return {
    metodo: 'Regressão linear + média móvel',
    tendencia,
    valoresPrevistos,
  }
}
