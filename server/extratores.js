import JSZip from 'jszip'
import { PDFParse } from 'pdf-parse'

// Extratores de conteúdo para cada formato aceito pelo LogiPilot.
// A ideia é sempre chegar em texto: é o texto que vai para a IA.
// A única exceção são as imagens, que seguem para o modelo de visão.

const LIMITE_LINHAS_PLANILHA = 500
const LIMITE_CARACTERES = 120_000

const decodificarEntidadesXml = (texto) => texto
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
  .replace(/&amp;/g, '&')

// Converte a referência de uma célula ("BC12") no índice da coluna (0, 1, 2...).
const indiceDaColuna = (referencia) => {
  const letras = referencia.replace(/\d+/g, '')
  return [...letras].reduce((indice, letra) => indice * 26 + (letra.charCodeAt(0) - 64), 0) - 1
}

const montarLinhaCsv = (celulas) => {
  const ultimaPreenchida = celulas.reduce((ultima, valor, indice) => (valor ? indice : ultima), -1)

  return celulas
    .slice(0, ultimaPreenchida + 1)
    .map((valor = '') => (/[;"\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor))
    .join(';')
}

// Um .xlsx é um zip de arquivos XML. Em vez de depender de uma biblioteca
// externa, lemos as duas partes que interessam: a tabela de textos
// compartilhados e as células de cada planilha.
export const extrairTextoDeXlsx = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer)

  const xmlTextos = await zip.file('xl/sharedStrings.xml')?.async('string')
  const textosCompartilhados = xmlTextos
    ? [...xmlTextos.matchAll(/<si>(.*?)<\/si>/gs)].map(([, bloco]) => (
      [...bloco.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(([, texto]) => decodificarEntidadesXml(texto)).join('')
    ))
    : []

  const nomesDasAbas = Object.keys(zip.files)
    .filter((caminho) => /^xl\/worksheets\/sheet\d+\.xml$/.test(caminho))
    .sort()

  const partes = []

  for (const caminho of nomesDasAbas) {
    const xml = await zip.file(caminho).async('string')
    const linhas = []

    for (const [, atributos, conteudo] of xml.matchAll(/<row([^>]*)>(.*?)<\/row>/gs)) {
      if (linhas.length >= LIMITE_LINHAS_PLANILHA) break

      const celulas = []

      for (const [, atributosCelula, corpo] of conteudo.matchAll(/<c([^>]*)>(.*?)<\/c>/gs)) {
        const referencia = atributosCelula.match(/r="([A-Z]+\d+)"/)?.[1]
        const tipo = atributosCelula.match(/t="([^"]+)"/)?.[1]
        const bruto = corpo.match(/<v>(.*?)<\/v>/s)?.[1]
          ?? [...corpo.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(([, texto]) => texto).join('')

        if (bruto === undefined || bruto === '') continue

        const valor = tipo === 's'
          ? textosCompartilhados[Number(bruto)] ?? ''
          : decodificarEntidadesXml(bruto)

        celulas[referencia ? indiceDaColuna(referencia) : celulas.length] = valor
      }

      // Linhas totalmente vazias não acrescentam nada ao diagnóstico.
      if (celulas.some(Boolean)) linhas.push(montarLinhaCsv([...celulas]))

      void atributos
    }

    if (linhas.length) {
      const numero = caminho.match(/sheet(\d+)\.xml$/)[1]
      partes.push(`--- Planilha ${numero} ---\n${linhas.join('\n')}`)
    }
  }

  return partes.join('\n\n')
}

// Um .pptx também é um zip de XML: cada slide tem seus textos em <a:t>.
export const extrairTextoDePptx = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer)

  const slides = Object.keys(zip.files)
    .filter((caminho) => /^ppt\/slides\/slide\d+\.xml$/.test(caminho))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))

  const partes = []

  for (const caminho of slides) {
    const xml = await zip.file(caminho).async('string')
    const textos = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/gs)]
      .map(([, texto]) => decodificarEntidadesXml(texto).trim())
      .filter(Boolean)

    if (textos.length) {
      partes.push(`--- Slide ${caminho.match(/\d+/)[0]} ---\n${textos.join('\n')}`)
    }
  }

  return partes.join('\n\n')
}

// O .docx segue a mesma lógica: texto dentro de <w:t>, parágrafo a parágrafo.
export const extrairTextoDeDocx = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file('word/document.xml')?.async('string')

  if (!xml) return ''

  return [...xml.matchAll(/<w:p[^>]*>(.*?)<\/w:p>/gs)]
    .map(([, paragrafo]) => (
      [...paragrafo.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gs)]
        .map(([, texto]) => decodificarEntidadesXml(texto))
        .join('')
    ))
    .filter((linha) => linha.trim())
    .join('\n')
}

export const extrairTextoDePdf = async (buffer) => {
  const leitor = new PDFParse({ data: new Uint8Array(buffer) })

  try {
    const { text } = await leitor.getText()
    return text || ''
  } finally {
    await leitor.destroy()
  }
}

const EXTENSAO = (nome) => (nome.split('.').pop() || '').toLowerCase()

export const ehImagem = (arquivo) => (
  arquivo.tipo?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(EXTENSAO(arquivo.nome))
)

/**
 * Recebe um arquivo vindo do front-end ({ nome, tipo, conteudo em base64 })
 * e devolve { nome, formato, texto } ou { nome, formato, imagem } no caso
 * de prints e fotos, que vão para o modelo de visão.
 */
export const extrairConteudo = async (arquivo) => {
  const extensao = EXTENSAO(arquivo.nome)
  const buffer = Buffer.from(arquivo.conteudo, 'base64')

  if (ehImagem(arquivo)) {
    return {
      nome: arquivo.nome,
      formato: 'imagem',
      imagem: `data:${arquivo.tipo || 'image/png'};base64,${arquivo.conteudo}`,
    }
  }

  const comoTexto = () => buffer.toString('utf8').replace(/^﻿/, '')

  const extratores = {
    xlsx: () => extrairTextoDeXlsx(buffer),
    xlsm: () => extrairTextoDeXlsx(buffer),
    pptx: () => extrairTextoDePptx(buffer),
    docx: () => extrairTextoDeDocx(buffer),
    pdf: () => extrairTextoDePdf(buffer),
  }

  const formatos = {
    xlsx: 'Excel', xlsm: 'Excel', pptx: 'PowerPoint', docx: 'Word', pdf: 'PDF',
    csv: 'CSV', tsv: 'CSV', txt: 'texto', md: 'texto', json: 'texto', xml: 'texto',
  }

  const texto = extratores[extensao] ? await extratores[extensao]() : comoTexto()

  return {
    nome: arquivo.nome,
    formato: formatos[extensao] || 'texto',
    texto: texto.slice(0, LIMITE_CARACTERES),
  }
}
