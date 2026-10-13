// Planilhas reais têm milhares de linhas e não cabem no limite de tokens do
// modelo. Em vez de cortar o arquivo no meio (o que esconderia dados), nós
// resumimos: cabeçalho, uma amostra de linhas e as estatísticas de cada coluna
// numérica. A IA recebe os fatos agregados em vez da tabela inteira.

const SEPARADORES = [';', '\t', ',', '|']

const detectarSeparador = (linha) => SEPARADORES.reduce((melhor, atual) => (
  linha.split(atual).length > linha.split(melhor).length ? atual : melhor
), SEPARADORES[0])

const paraNumero = (valor = '') => {
  let limpo = valor.replace(/[R$%\s]/g, '')
  if (!/\d/.test(limpo)) return Number.NaN

  if (limpo.includes(',') && limpo.includes('.')) {
    limpo = limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '')
  } else if (limpo.includes(',')) {
    limpo = limpo.replace(',', '.')
  }

  return Number(limpo)
}

const formatar = (valor) => {
  if (!Number.isFinite(valor)) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
}

const LINHAS_DE_AMOSTRA = 12

const resumirTabela = (linhas) => {
  const separador = detectarSeparador(linhas[0])
  const grade = linhas.map((linha) => (
    linha.split(separador).map((campo) => campo.trim().replace(/^"|"$/g, ''))
  ))

  const cabecalho = grade[0]
  const corpo = grade.slice(1)
  const totalColunas = Math.max(...grade.map((campos) => campos.length))

  const estatisticas = []

  for (let coluna = 0; coluna < totalColunas; coluna += 1) {
    const valores = corpo
      .map((campos) => paraNumero(campos[coluna] || ''))
      .filter(Number.isFinite)

    // Só vale tratar como coluna numérica se a maior parte das linhas for número.
    if (valores.length < corpo.length * 0.6 || valores.length < 2) continue

    const soma = valores.reduce((total, valor) => total + valor, 0)
    const ordenados = [...valores].sort((a, b) => a - b)
    const mediana = ordenados[Math.floor(ordenados.length / 2)]

    estatisticas.push(
      `- ${cabecalho[coluna] || `coluna ${coluna + 1}`}: `
      + `soma ${formatar(soma)} | média ${formatar(soma / valores.length)} | `
      + `mediana ${formatar(mediana)} | mínimo ${formatar(ordenados[0])} | `
      + `máximo ${formatar(ordenados.at(-1))} | ${valores.length} valores`,
    )
  }

  const partes = [
    `Tabela com ${corpo.length} linhas e ${totalColunas} colunas.`,
    `Colunas: ${cabecalho.join(' | ')}`,
  ]

  if (estatisticas.length) {
    partes.push(`\nEstatísticas das colunas numéricas (calculadas sobre TODAS as ${corpo.length} linhas):`)
    partes.push(estatisticas.join('\n'))
  }

  partes.push(`\nAmostra das primeiras ${Math.min(LINHAS_DE_AMOSTRA, corpo.length)} linhas:`)
  partes.push(linhas.slice(0, LINHAS_DE_AMOSTRA + 1).join('\n'))

  if (corpo.length > LINHAS_DE_AMOSTRA) {
    partes.push(
      `\n(As demais ${corpo.length - LINHAS_DE_AMOSTRA} linhas não foram transcritas, mas `
      + 'estão refletidas nas estatísticas acima.)',
    )
  }

  return partes.join('\n')
}

const pareceTabela = (linhas) => {
  if (linhas.length < 4) return false

  const separador = detectarSeparador(linhas[0])
  const colunasDoCabecalho = linhas[0].split(separador).length
  if (colunasDoCabecalho < 2) return false

  // Numa tabela de verdade a maioria das linhas tem o mesmo número de colunas.
  const consistentes = linhas.filter((linha) => (
    Math.abs(linha.split(separador).length - colunasDoCabecalho) <= 1
  ))

  return consistentes.length >= linhas.length * 0.7
}

/**
 * Reduz o texto extraído de um arquivo ao que cabe no orçamento de caracteres,
 * preservando o máximo de informação útil.
 */
export const resumirTexto = (texto, orcamento) => {
  if (!texto) return ''
  if (texto.length <= orcamento) return texto

  // Planilhas podem ter várias abas; cada bloco é resumido separadamente.
  const blocos = texto.split(/\n(?=--- (?:Planilha|Slide) )/)

  const resumidos = blocos.map((bloco) => {
    const linhas = bloco.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean)
    const titulo = linhas[0]?.startsWith('---') ? linhas.shift() : ''

    if (!pareceTabela(linhas)) return bloco

    return [titulo, resumirTabela(linhas)].filter(Boolean).join('\n')
  })

  const resultado = resumidos.join('\n\n')

  if (resultado.length <= orcamento) return resultado

  return `${resultado.slice(0, orcamento)}\n\n(Conteúdo cortado por limite de tamanho.)`
}
