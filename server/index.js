import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'

import { extrairConteudo } from './extratores.js'
import { gerarDiagnosticoLocal, detectarSerieTemporal } from './diagnosticoLocal.js'
import { resumirTexto } from './resumo.js'
import { otimizarRotaLocal } from './rotaLocal.js'
import { diagnosticarOperacaoLocal } from './operacaoLocal.js'
import {
  PROMPT_ANALISE,
  PROMPT_CHAT,
  PROMPT_OPERACAO,
  PROMPT_ROTA,
  montarMensagemDaOperacao,
  montarMensagemDaRota,
  montarMensagemDoUsuario,
} from './prompts.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env'), quiet: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '25mb' }))

const PORT = process.env.PORT || 3333
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Modelo de texto para o diagnóstico e modelo de visão para prints e fotos.
const MODELO_TEXTO = 'openai/gpt-oss-120b'
const MODELO_VISAO = process.env.GROQ_MODELO_VISAO || 'qwen/qwen3.8-27b'

// Quantos caracteres de dados cabem numa requisição. Planilhas grandes passam
// antes pelo resumo (server/resumo.js), então o que vai para a IA são as
// estatísticas da tabela, e não as milhares de linhas originais.
// Contas com limite de tokens maior podem aumentar este valor no .env.
const ORCAMENTO_DE_CARACTERES = Number(process.env.LIMITE_CARACTERES_IA) || 15000

const chamarGroq = async (corpo) => {
  const resposta = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(corpo),
  })

  if (!resposta.ok) {
    const detalhe = await resposta.text()
    console.error('Erro na API da Groq:', resposta.status, detalhe)
    throw new Error(`A API da Groq respondeu com status ${resposta.status}.`)
  }

  const dados = await resposta.json()
  const conteudo = dados.choices?.[0]?.message?.content

  if (!conteudo) throw new Error('A IA não retornou conteúdo.')

  return conteudo
}

/**
 * Prints e fotos não têm texto que possa ser lido diretamente, então cada
 * imagem passa antes pelo modelo de visão, que a descreve em texto. É esse
 * texto que entra no diagnóstico junto com os demais arquivos.
 */
const descreverImagem = async (imagem) => {
  const conteudo = await chamarGroq({
    model: MODELO_VISAO,
    temperature: 0.2,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Esta imagem é um print ou foto de dados de uma operação logística. '
            + 'Transcreva TODOS os números, rótulos, eixos, legendas e tabelas que conseguir ler, '
            + 'de forma organizada e em português do Brasil. Não invente valores: '
            + 'se algo estiver ilegível, escreva "ilegível".',
        },
        { type: 'image_url', image_url: { url: imagem.imagem } },
      ],
    }],
  })

  return { ...imagem, texto: conteudo, lidaPorVisao: true }
}

app.post('/analisar', async (req, res) => {
  const { titulo, arquivos = [], textoLivre = '' } = req.body

  if (!Array.isArray(arquivos) || (arquivos.length === 0 && !textoLivre.trim())) {
    return res.status(400).json({ erro: 'Envie pelo menos um arquivo ou descreva os dados no campo de texto.' })
  }

  let conteudos
  try {
    conteudos = await Promise.all(arquivos.map(extrairConteudo))
  } catch (error) {
    console.error('Erro ao extrair o conteúdo dos arquivos:', error)
    return res.status(400).json({ erro: `Não foi possível ler um dos arquivos enviados. ${error.message}` })
  }

  const temConteudo = conteudos.some((item) => item.imagem || item.texto?.trim()) || textoLivre.trim()

  if (!temConteudo) {
    return res.status(400).json({ erro: 'Os arquivos enviados estão vazios ou não puderam ser lidos.' })
  }

  // A série temporal alimenta o gráfico e a previsão, que são calculados
  // localmente (sem IA) a partir da primeira coluna numérica encontrada.
  const serieTemporal = detectarSerieTemporal(conteudos, textoLivre)

  const fontes = conteudos.map((item) => `${item.nome} (${item.formato})`)
  if (textoLivre.trim()) fontes.push('Texto informado pelo usuário')

  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY não configurada: usando diagnóstico local.')
    return res.json({ ...gerarDiagnosticoLocal(titulo, serieTemporal, fontes), serieTemporal, fontes })
  }

  try {
    const comVisao = await Promise.all(
      conteudos.map((item) => (item.imagem ? descreverImagem(item) : item)),
    )

    // O orçamento é dividido entre os arquivos para que um arquivo grande não
    // consuma sozinho todo o espaço e deixe os outros de fora da análise.
    const orcamentoPorArquivo = Math.floor(
      (ORCAMENTO_DE_CARACTERES - textoLivre.length) / Math.max(comVisao.length, 1),
    )

    const resumidos = comVisao.map((item) => ({
      ...item,
      texto: resumirTexto(item.texto, Math.max(orcamentoPorArquivo, 1000)),
    }))

    const conteudo = await chamarGroq({
      model: MODELO_TEXTO,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT_ANALISE },
        { role: 'user', content: montarMensagemDoUsuario(titulo, resumidos, textoLivre) },
      ],
    })

    return res.json({ ...JSON.parse(conteudo), serieTemporal, fontes })
  } catch (error) {
    console.error('Erro ao gerar a análise com a IA; usando diagnóstico local:', error)
    return res.json({ ...gerarDiagnosticoLocal(titulo, serieTemporal, fontes), serieTemporal, fontes })
  }
})

// "Chat com os dados": responde perguntas sobre uma análise já gerada.
app.post('/perguntar', async (req, res) => {
  const { pergunta, resultado } = req.body

  if (typeof pergunta !== 'string' || !pergunta.trim()) {
    return res.status(400).json({ erro: 'Escreva uma pergunta sobre a análise.' })
  }

  if (!resultado) {
    return res.status(400).json({ erro: 'Envie o resultado da análise junto com a pergunta.' })
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      erro: 'O chat precisa da chave da Groq configurada em server/.env para funcionar.',
    })
  }

  try {
    const resposta = await chamarGroq({
      model: MODELO_TEXTO,
      temperature: 0.2,
      messages: [
        { role: 'system', content: PROMPT_CHAT },
        {
          role: 'user',
          content: `Análise gerada (JSON):\n${JSON.stringify(resultado)}\n\nPergunta: ${pergunta}`,
        },
      ],
    })

    return res.json({ resposta })
  } catch (error) {
    console.error('Erro ao responder a pergunta:', error)
    return res.status(502).json({ erro: 'Não foi possível responder agora. Tente novamente.' })
  }
})

/**
 * "Otimizar entregas": recebe as paradas pendentes de um motorista e devolve a
 * sequência em que elas devem ser visitadas. Sem chave da Groq — ou se a IA
 * devolver uma sequência inválida — a ordem vem do cálculo local.
 */
app.post('/otimizar-rota', async (req, res) => {
  const { entregas = [], motorista = '' } = req.body

  if (!Array.isArray(entregas) || entregas.length < 2) {
    return res.status(400).json({ erro: 'Envie pelo menos duas entregas pendentes para otimizar a rota.' })
  }

  const idsRecebidos = entregas.map((entrega) => String(entrega.id))

  // A IA só é aceita se devolver uma permutação exata dos ids enviados:
  // uma parada perdida ou repetida quebraria a rota do motorista.
  const sequenciaValida = (ordem) => Array.isArray(ordem)
    && ordem.length === idsRecebidos.length
    && new Set(ordem.map(String)).size === idsRecebidos.length
    && ordem.every((id) => idsRecebidos.includes(String(id)))

  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY não configurada: usando a sequência calculada localmente.')
    return res.json(otimizarRotaLocal(entregas))
  }

  try {
    const conteudo = await chamarGroq({
      model: MODELO_TEXTO,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT_ROTA },
        { role: 'user', content: montarMensagemDaRota(motorista, entregas) },
      ],
    })

    const resultado = JSON.parse(conteudo)

    if (!sequenciaValida(resultado.ordem)) {
      console.warn('A IA devolveu uma sequência incompleta; usando a sequência local.')
      return res.json(otimizarRotaLocal(entregas))
    }

    return res.json({
      ordem: resultado.ordem.map(String),
      justificativa: resultado.justificativa || '',
      paradas: Array.isArray(resultado.paradas) ? resultado.paradas : [],
      origem: 'ia',
    })
  } catch (error) {
    console.error('Erro ao otimizar a rota com a IA; usando a sequência local:', error)
    return res.json(otimizarRotaLocal(entregas))
  }
})

/**
 * Diagnóstico da operação a partir das entregas que o próprio LogiPilot
 * registrou — sem planilha nenhuma. Devolve o mesmo formato de /analisar,
 * então a tela de detalhe da análise funciona igual.
 */
app.post('/analisar-operacao', async (req, res) => {
  const { relatorio } = req.body

  if (!relatorio || !relatorio.totais) {
    return res.status(400).json({ erro: 'Envie o relatório de entregas do período.' })
  }

  if (!relatorio.totais.entregas) {
    return res.status(400).json({
      erro: 'Não há entregas registradas no período escolhido para analisar.',
    })
  }

  // O gráfico e a previsão saem das entregas concluídas por dia, calculados
  // aqui mesmo — a IA não participa desta parte.
  const serieTemporal = (relatorio.porDia || []).map((dia) => ({
    rotulo: dia.data,
    valor: Number(dia.entregues) || 0,
  }))

  const fontes = [`Entregas registradas no LogiPilot (${relatorio.de} a ${relatorio.ate})`]

  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY não configurada: usando o diagnóstico local da operação.')
    return res.json({ ...diagnosticarOperacaoLocal(relatorio), serieTemporal, fontes })
  }

  try {
    const conteudo = await chamarGroq({
      model: MODELO_TEXTO,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT_OPERACAO },
        { role: 'user', content: montarMensagemDaOperacao(relatorio) },
      ],
    })

    return res.json({ ...JSON.parse(conteudo), serieTemporal, fontes })
  } catch (error) {
    console.error('Erro ao analisar a operação com a IA; usando o diagnóstico local:', error)
    return res.json({ ...diagnosticarOperacaoLocal(relatorio), serieTemporal, fontes })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor de IA rodando em http://localhost:${PORT}`)
})
