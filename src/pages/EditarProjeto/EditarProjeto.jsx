import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const EditarProjeto = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projeto, setProjeto] = useState({ nome: '', cliente: '', clienteId: '', criadoEm: '' })
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get(`/projetos/${id}`), api.get('/clientes')])
      .then(([respostaProjeto, respostaClientes]) => {
        setProjeto(respostaProjeto.data)
        setClientes(respostaClientes.data)
      })
      .catch((error) => {
        console.error('Erro ao buscar o projeto.', error)
        setErro('Não foi possível carregar o projeto solicitado.')
      })
      .finally(() => setCarregando(false))
  }, [id])

  const atualizarProjeto = async (e) => {
    e.preventDefault()

    const clienteEscolhido = clientes.find((c) => String(c.id) === String(projeto.clienteId))

    if (!clienteEscolhido) {
      setErro('Selecione um cliente cadastrado.')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      await api.put(`/projetos/${id}`, {
        ...projeto,
        nome: projeto.nome.trim(),
        clienteId: clienteEscolhido.id,
        cliente: clienteEscolhido.nome,
      })
      navigate('/dashboard/projetos')
    } catch (error) {
      console.error('Não foi possível atualizar o projeto.', error)
      setErro('Não foi possível atualizar o projeto. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Edição de Projeto" />

        {carregando ? (
          <p className="text-muted">Carregando projeto...</p>
        ) : !projeto.id && erro ? (
          <div className="alert alert-danger" role="alert">{erro}</div>
        ) : (
          <form className="content-card page-form card shadow-sm p-4" onSubmit={atualizarProjeto}>
            <div className="mb-3">
              <label className="form-label" htmlFor="nome">Nome do projeto</label>
              <input
                id="nome"
                className="form-control"
                value={projeto.nome}
                onChange={(e) => setProjeto((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="cliente">Cliente</label>
              <select
                id="cliente"
                className="form-select"
                value={projeto.clienteId || ''}
                onChange={(e) => setProjeto((prev) => ({ ...prev, clienteId: e.target.value }))}
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

export default EditarProjeto
