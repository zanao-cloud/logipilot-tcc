import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import iaApi from '../../services/iaApi'
import { getUsuarioLogado } from '../../services/sessao'
import SidebarGestor from '../../components/SidebarGestor'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'

const extrairSerieTemporal = (csv) => {
  const linhas = csv.trim().split('\n')
  const linhasDeDados = linhas.slice(1)

  return linhasDeDados
    .map((linha) => Number(linha.split(',')[1]))
    .filter((numero) => !Number.isNaN(numero))
}

const lerArquivoComoTexto = (arquivo) => {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result)
    leitor.onerror = reject
    leitor.readAsText(arquivo)
  })
}

const NovaAnalise = () => {
  const usuario = getUsuarioLogado()
  const [titulo, setTitulo] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [projetos, setProjetos] = useState([])
  const [arquivo, setArquivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/projetos')
      .then((response) => setProjetos(response.data))
      .catch((error) => console.error('Erro ao buscar projetos.', error))
  }, [])

  const gerarAnalise = async (e) => {
    e.preventDefault()

    if (!arquivo) {
      alert('Selecione um arquivo CSV com os dados da operação.')
      return
    }

    setEnviando(true)

    try {
      const csv = await lerArquivoComoTexto(arquivo)
      const respostaIA = await iaApi.post('/analisar', { titulo, csv })

      const analise = {
        titulo,
        projetoId,
        criadoPorId: usuario.id,
        status: 'concluida',
        criadoEm: new Date().toISOString().slice(0, 10),
        serieTemporal: extrairSerieTemporal(csv),
        resultado: respostaIA.data,
      }

      const respostaSalvar = await api.post('/analises', analise)
      navigate(`/analises/${respostaSalvar.data.id}`)
    } catch (error) {
      console.error('Não foi possível gerar a análise.', error)
      alert('Não foi possível gerar a análise. Verifique se o servidor de IA está rodando (npm run ia).')
    } finally {
      setEnviando(false)
    }
  }

  const Sidebar = usuario?.papel === 'gestor' ? SidebarGestor : SidebarOperador

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Nova Análise" />

        <form className="card shadow-sm p-4" style={{ maxWidth: 520 }} onSubmit={gerarAnalise}>
          <div className="mb-3">
            <label className="form-label">Título da análise</label>
            <input className="form-control" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Projeto</label>
            <select
              className="form-select"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              required
            >
              <option value="">Selecione um projeto</option>
              {projetos.map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Arquivo CSV com os dados da operação</label>
            <input
              type="file"
              accept=".csv"
              className="form-control"
              onChange={(e) => setArquivo(e.target.files[0])}
              required
            />
            <div className="form-text">
              A primeira coluna deve ser o período (ex: data) e a segunda o indicador principal (ex: entregas).
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Analisando...' : 'Gerar diagnóstico'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NovaAnalise
