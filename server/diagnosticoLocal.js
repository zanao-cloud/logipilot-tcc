// Série temporal e diagnóstico calculados sem IA.
// Servem para dois casos: alimentar o gráfico e a previsão da plataforma, e
// manter a aplicação funcionando quando a chave da Groq não está configurada.

const SEPARADORES = [';', '\t', ',', '|']

const ehNumero = (valor) => {
  if (!valor) return false
  // Aceita "1.234,56", "1,234.56", "R$ 18,40" e "7,2%".
  const limpo = valor.replace(/[R$%\s]/g, '')
  return /^-?[\d.,]+$/.test(limpo) && /\d/.test(limpo)
}

const paraNumero = (valor) => {
  let limpo = valor.replace(/[R$%\s]/g, '')

  // Quando há vírgula e ponto, o que vier por último é o separador decimal.
  if (limpo.includes(',') && limpo.includes('.')) {
    limpo = limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '')
  } else if (limpo.includes(',')) {
    limpo = limpo.replace(',', '.')
  }

  const numero = Number(limpo)
  return Number.isFinite(numero) ? numero : Number.NaN
}

const detectarSeparador = (linha) => SEPARADORES.reduce((melhor, atual) => (
  linha.split(atual).length > linha.split(melhor).length ? atual : melhor
), SEPARADORES[0])

/**
 * Procura, em todo o conteúdo extraído, o primeiro bloco que se pareça com uma
 * tabela e devolve a coluna numérica com mais valores como série temporal.
 * Devolve [{ rotulo, valor }] — os rótulos vêm da primeira coluna.
 */
export const detectarSerieTemporal = (conteudos, textoLivre = '') => {
  const textos = [...conteudos.map((item) => item.texto || ''), textoLivre]

  for (const texto of textos) {
    const linhas = texto.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean)
    if (linhas.length < 3) continue

    // A linha mais "colunada" costuma ser o cabeçalho da tabela.
    const referencia = linhas.find((linha) => SEPARADORES.some((s) => linha.split(s).length > 1))
    if (!referencia) continue

    const separador = detectarSeparador(referencia)
    const grade = linhas
      .map((linha) => linha.split(separador).map((campo) => campo.trim().replace(/^"|"$/g, '')))
      .filter((campos) => campos.length > 1)

    if (grade.length < 3) continue

    const totalColunas = Math.max(...grade.map((campos) => campos.length))
    let melhorColuna = -1
    let melhorQuantidade = 0

    // A coluna 0 normalmente guarda o período/rótulo, então começamos da 1.
    for (let coluna = 1; coluna < totalColunas; coluna += 1) {
      const quantidade = grade.filter((campos) => ehNumero(campos[coluna])).length
      if (quantidade > melhorQuantidade) {
        melhorQuantidade = quantidade
        melhorColuna = coluna
      }
    }

    if (melhorColuna === -1 || melhorQuantidade < 2) continue

    const serie = grade
      .filter((campos) => ehNumero(campos[melhorColuna]))
      .map((campos, indice) => ({
        rotulo: campos[0] || `Período ${indice + 1}`,
        valor: paraNumero(campos[melhorColuna]),
      }))
      .filter((ponto) => Number.isFinite(ponto.valor))
      .slice(0, 60)

    if (serie.length >= 2) return serie
  }

  return []
}

const formatar = (valor) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)

export const gerarDiagnosticoLocal = (titulo, serieTemporal, fontes) => {
  const valores = serieTemporal.map((ponto) => ponto.valor)
  const primeiro = valores[0] || 0
  const ultimo = valores.at(-1) || 0
  const total = valores.reduce((soma, valor) => soma + valor, 0)
  const media = valores.length ? total / valores.length : 0
  const variacao = primeiro ? ((ultimo - primeiro) / primeiro) * 100 : 0

  const tendencia = variacao > 2 ? 'alta' : variacao < -2 ? 'baixa' : 'estavel'
  const direcao = tendencia === 'alta' ? 'crescimento' : tendencia === 'baixa' ? 'redução' : 'estabilidade'

  // Sem IA não há como avaliar a operação de verdade, então o score fica
  // neutro e a limitação é declarada abertamente.
  const temSerie = valores.length >= 2

  return {
    resumo: {
      titulo: titulo || 'Diagnóstico da operação',
      visaoGeral: temSerie
        ? `Foram avaliados ${valores.length} períodos a partir de ${fontes.length} fonte(s) de dados. `
          + `O indicador encerrou em ${formatar(ultimo)}, com ${direcao} de `
          + `${Math.abs(variacao).toFixed(1).replace('.', ',')}% em relação ao primeiro período.`
        : `Foram recebidas ${fontes.length} fonte(s) de dados, mas não foi possível identificar uma `
          + 'série numérica para calcular a evolução da operação.',
      periodo: 'não informado',
      destaques: temSerie
        ? [
          `Total acumulado: ${formatar(total)}.`,
          `Média por período: ${formatar(media)}.`,
          `Último valor informado: ${formatar(ultimo)}.`,
        ]
        : ['Os arquivos foram lidos, mas sem uma tabela numérica reconhecível.'],
    },
    indicadores: temSerie
      ? [
        { nome: 'Total no período', valor: formatar(total), unidade: '', tendencia, situacao: 'neutra' },
        { nome: 'Média por período', valor: formatar(media), unidade: '', tendencia: 'estavel', situacao: 'neutra' },
        { nome: 'Variação no período', valor: `${variacao.toFixed(1).replace('.', ',')}%`, unidade: '', tendencia, situacao: tendencia === 'baixa' ? 'atencao' : 'neutra' },
      ]
      : [],
    diagnostico: {
      scoreSaude: 50,
      avaliacaoGeral: temSerie
        ? `O comportamento observado indica ${direcao} no indicador principal. Este diagnóstico foi `
          + 'calculado localmente, sem IA, e por isso se limita à evolução numérica da série.'
        : 'Este diagnóstico foi calculado localmente, sem IA, e os dados enviados não permitiram '
          + 'identificar uma série numérica para análise.',
      fatosObservados: temSerie
        ? [
          `A série analisada tem ${valores.length} períodos.`,
          `O valor variou de ${formatar(primeiro)} para ${formatar(ultimo)}.`,
        ]
        : [`Foram processadas ${fontes.length} fonte(s): ${fontes.join(', ')}.`],
      hipoteses: [],
    },
    gargalos: [],
    oportunidades: [],
    planoDeAcao: [
      {
        titulo: temSerie ? 'Acompanhar a evolução do indicador' : 'Revisar os dados enviados',
        descricao: temSerie
          ? 'Compare os próximos períodos com a média calculada para confirmar o padrão observado.'
          : 'Envie uma planilha ou CSV com uma coluna de período e uma coluna numérica de indicador.',
        prioridade: 'media',
        prazo: '15 dias',
        resultadoEsperado: 'Base consistente para o próximo diagnóstico.',
      },
      {
        titulo: 'Configurar a chave da IA',
        descricao: 'Preencha GROQ_API_KEY em server/.env para liberar o diagnóstico completo, '
          + 'com gargalos, oportunidades e score de saúde operacional.',
        prioridade: 'alta',
        prazo: 'imediato',
        resultadoEsperado: 'Diagnóstico completo gerado por IA.',
      },
    ],
    limitacoes: [
      'Diagnóstico gerado localmente, sem IA: não há análise de causas, gargalos ou oportunidades.',
      'Apenas a primeira coluna numérica encontrada foi considerada.',
    ],
  }
}
