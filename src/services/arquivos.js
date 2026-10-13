// Formatos que o LogiPilot aceita. O processamento de cada um acontece no
// servidor de IA (server/extratores.js); aqui só validamos e preparamos o envio.
export const FORMATOS_ACEITOS = [
  { extensoes: ['xlsx', 'xlsm', 'xls'], rotulo: 'Excel / XLSX', icone: 'fa-file-excel', cor: '#10b981' },
  { extensoes: ['csv', 'tsv'], rotulo: 'CSV', icone: 'fa-table', cor: '#14b8a6' },
  { extensoes: ['pdf'], rotulo: 'PDF', icone: 'fa-file-pdf', cor: '#ef4444' },
  { extensoes: ['pptx'], rotulo: 'PowerPoint', icone: 'fa-file-powerpoint', cor: '#f97316' },
  { extensoes: ['docx'], rotulo: 'Word', icone: 'fa-file-word', cor: '#3b82f6' },
  { extensoes: ['png', 'jpg', 'jpeg', 'webp'], rotulo: 'Imagens e prints', icone: 'fa-image', cor: '#a78bfa' },
  { extensoes: ['txt', 'md'], rotulo: 'Texto', icone: 'fa-file-lines', cor: '#94a3b8' },
  { extensoes: ['json', 'xml'], rotulo: 'Power BI / exportações', icone: 'fa-chart-column', cor: '#f59e0b' },
]

// Limite por arquivo. O servidor de IA aceita um corpo de até 25 MB no total.
export const TAMANHO_MAXIMO = 8 * 1024 * 1024

export const EXTENSOES_ACEITAS = FORMATOS_ACEITOS.flatMap((formato) => formato.extensoes)

export const ATRIBUTO_ACCEPT = EXTENSOES_ACEITAS.map((extensao) => `.${extensao}`).join(',')

export const extensaoDe = (nome) => (nome.split('.').pop() || '').toLowerCase()

export const formatoDe = (nome) => {
  const extensao = extensaoDe(nome)
  return FORMATOS_ACEITOS.find((formato) => formato.extensoes.includes(extensao))
}

export const formatarTamanho = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const validarArquivo = (arquivo) => {
  if (!formatoDe(arquivo.name)) {
    return `"${arquivo.name}" não é um formato aceito.`
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return `"${arquivo.name}" tem ${formatarTamanho(arquivo.size)} e o limite é ${formatarTamanho(TAMANHO_MAXIMO)}.`
  }

  return ''
}

// O FileReader devolve algo como "data:image/png;base64,iVBORw0KGgo...".
// Para o servidor só interessa o que vem depois da vírgula.
export const lerComoBase64 = (arquivo) => {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '')
    leitor.onerror = () => reject(new Error(`Não foi possível ler o arquivo "${arquivo.name}".`))
    leitor.readAsDataURL(arquivo)
  })
}

export const prepararParaEnvio = async (arquivo) => ({
  nome: arquivo.name,
  tipo: arquivo.type,
  tamanho: arquivo.size,
  conteudo: await lerComoBase64(arquivo),
})
