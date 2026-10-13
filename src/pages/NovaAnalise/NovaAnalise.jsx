import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import iaApi from '../../services/iaApi'
import { getUsuarioLogado } from '../../services/sessao'
import {
  ATRIBUTO_ACCEPT,
  FORMATOS_ACEITOS,
  formatarTamanho,
  formatoDe,
  prepararParaEnvio,
  validarArquivo,
} from '../../services/arquivos'
import SidebarGestor from '../../components/SidebarGestor'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import styles from './NovaAnalise.module.css'

const NovaAnalise = () => {
  const usuario = getUsuarioLogado()
  const [titulo, setTitulo] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [projetos, setProjetos] = useState([])
  const [arquivos, setArquivos] = useState([])
  const [textoLivre, setTextoLivre] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/projetos')
      .then((response) => setProjetos(response.data))
      .catch((error) => console.error('Erro ao buscar projetos.', error))
  }, [])

  const adicionarArquivos = (e) => {
    const selecionados = [...e.target.files]
    const recusados = selecionados.map(validarArquivo).filter(Boolean)

    setErro(recusados.join(' '))
    setArquivos((anteriores) => {
      const aceitos = selecionados.filter((arquivo) => !validarArquivo(arquivo))
      const nomesJaAdicionados = anteriores.map((arquivo) => arquivo.name)

      return [...anteriores, ...aceitos.filter((arquivo) => !nomesJaAdicionados.includes(arquivo.name))]
    })

    // Permite escolher o mesmo arquivo de novo depois de removê-lo da lista.
    e.target.value = ''
  }

  const removerArquivo = (nome) => {
    setArquivos((anteriores) => anteriores.filter((arquivo) => arquivo.name !== nome))
  }

  const gerarAnalise = async (e) => {
    e.preventDefault()

    if (arquivos.length === 0 && !textoLivre.trim()) {
      setErro('Envie pelo menos um arquivo ou descreva os dados da operação no campo de texto.')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      const arquivosParaEnvio = await Promise.all(arquivos.map(prepararParaEnvio))
      const respostaIA = await iaApi.post('/analisar', {
        titulo,
        arquivos: arquivosParaEnvio,
        textoLivre,
      })

      const analise = {
        titulo,
        projetoId,
        criadoPorId: usuario.id,
        status: 'concluida',
        criadoEm: new Date().toISOString().slice(0, 10),
        serieTemporal: respostaIA.data.serieTemporal || [],
        fontes: respostaIA.data.fontes || [],
        resultado: respostaIA.data,
      }

      const respostaSalvar = await api.post('/analises', analise)
      navigate(`/analises/${respostaSalvar.data.id}`)
    } catch (error) {
      console.error('Não foi possível gerar a análise.', error)

      // Sem resposta do servidor normalmente significa que o processo de IA
      // não está rodando — o erro cru do axios ("Network Error") não ajuda.
      const semResposta = !error.response && error.request

      setErro(
        error.response?.data?.erro
        || (semResposta
          ? 'O servidor de IA não respondeu. Abra outro terminal e rode "npm run ia" '
            + '(ou use "npm run dev:all" para subir os três serviços de uma vez).'
          : error.message)
        || 'Não foi possível gerar a análise. Verifique se os serviços estão rodando.',
      )
    } finally {
      setEnviando(false)
    }
  }

  const Sidebar = usuario?.papel === 'gestor' ? SidebarGestor : SidebarOperador

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <Sidebar />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Nova Análise" />

        <form className="content-card card shadow-sm p-4" onSubmit={gerarAnalise}>
          <div className="mb-3">
            <label className="form-label" htmlFor="titulo">Título da análise</label>
            <input
              id="titulo"
              className="form-control"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="projeto">Projeto</label>
            <select
              id="projeto"
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
            <label className="form-label" htmlFor="arquivos">Dados da operação</label>

            <div className={styles.formatos}>
              {FORMATOS_ACEITOS.map((formato) => (
                <span key={formato.rotulo} className={styles.formato}>
                  <i className={`fas ${formato.icone}`} style={{ color: formato.cor }} />
                  {formato.rotulo}
                </span>
              ))}
            </div>

            <input
              id="arquivos"
              type="file"
              multiple
              accept={ATRIBUTO_ACCEPT}
              className="form-control"
              onChange={adicionarArquivos}
            />
            <div className="form-text">
              Envie quantos arquivos quiser. Planilhas, PDFs e apresentações têm o texto extraído;
              prints e fotos são lidos por visão computacional.
            </div>
          </div>

          {arquivos.length > 0 && (
            <ul className={styles.lista}>
              {arquivos.map((arquivo) => {
                const formato = formatoDe(arquivo.name)

                return (
                  <li key={arquivo.name} className={styles.item}>
                    <i className={`fas ${formato.icone}`} style={{ color: formato.cor }} />
                    <span className={styles.nome}>{arquivo.name}</span>
                    <span className={styles.tamanho}>{formatarTamanho(arquivo.size)}</span>
                    <button
                      type="button"
                      className={styles.remover}
                      onClick={() => removerArquivo(arquivo.name)}
                      aria-label={`Remover ${arquivo.name}`}
                    >
                      <i className="fas fa-xmark" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="contexto">
              Contexto da operação <span className="text-muted fw-normal">(opcional)</span>
            </label>
            <textarea
              id="contexto"
              className="form-control"
              rows={4}
              value={textoLivre}
              onChange={(e) => setTextoLivre(e.target.value)}
              placeholder="Ex: frota de 12 veículos atendendo a Grande São Paulo. O custo subiu depois da troca de transportadora em agosto."
            />
            <div className="form-text">
              Pode colar números soltos aqui também — o texto entra na análise junto com os arquivos.
            </div>
          </div>

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Analisando...' : 'Gerar diagnóstico'}
          </button>

          {enviando && (
            <p className="form-text text-center mb-0 mt-2">
              Lendo os arquivos e consultando a IA. Isso pode levar alguns minutos.
            </p>
          )}
        </form>
      </main>
    </div>
  )
}

export default NovaAnalise
