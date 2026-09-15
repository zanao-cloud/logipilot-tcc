import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env'), quiet: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const PORT = process.env.PORT || 3333
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'

const PROMPT_SISTEMA = `Você é o "Pilô", um analista de operações logísticas.
Você recebe dados brutos (em CSV) de uma operação de transporte/logística e devolve um diagnóstico.
Responda SEMPRE em português do Brasil e SEMPRE em JSON válido, sem nenhum texto fora do JSON, no seguinte formato exato:
{
  "resumo": {
    "titulo": "string curta",
    "visaoGeral": "um parágrafo explicando o que os dados mostram",
    "destaques": ["3 a 5 frases curtas com os pontos mais importantes"]
  },
  "indicadores": [
    { "nome": "string", "valor": "string", "unidade": "string", "tendencia": "alta" | "baixa" | "estavel" }
  ],
  "diagnostico": "um parágrafo com a avaliação geral da operação",
  "planoDeAcao": [
    { "titulo": "string", "descricao": "string", "prioridade": "alta" | "media" | "baixa" }
  ]
}
Gere de 3 a 5 indicadores e de 2 a 4 itens no plano de ação, sempre baseados nos números reais enviados.`

app.post('/analisar', async (req, res) => {
  const { titulo, csv } = req.body

  if (!csv) {
    return res.status(400).json({ erro: 'Envie o conteúdo do CSV no campo "csv".' })
  }

  try {
    const resposta = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PROMPT_SISTEMA },
          {
            role: 'user',
            content: `Título da análise: ${titulo || 'Análise sem título'}\n\nDados (CSV):\n${csv}`,
          },
        ],
      }),
    })

    if (!resposta.ok) {
      const detalhe = await resposta.text()
      console.error('Erro na API da Groq:', resposta.status, detalhe)
      return res.status(502).json({ erro: 'Não foi possível gerar o diagnóstico com a IA.' })
    }

    const dados = await resposta.json()
    const conteudo = dados.choices[0].message.content
    const resultado = JSON.parse(conteudo)

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao chamar a IA:', error)
    return res.status(500).json({ erro: 'Erro interno ao gerar o diagnóstico.' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor de IA rodando em http://localhost:${PORT}`)
})
