import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const NovoProjeto = () => {
  const [nome, setNome] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  // O cliente não é mais digitado: o projeto só pode apontar para um cliente
  // já cadastrado em Dashboard → Clientes.
  useEffect(() => {
    api
      .get('/clientes')
      .then((response) => setClientes(response.data))
      .catch((error) => {
        console.error('Erro ao buscar os clientes.', error)
        setErro('Não foi possível carregar a lista de clientes.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const enviarProjeto = async (e) => {
    e.preventDefault()

    const clienteEscolhido = clientes.find((c) => String(c.id) === String(clienteId))

    if (!clienteEscolhido) {
      setErro('Selecione um cliente cadastrado.')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      await api.post('/projetos', {
        nome: nome.trim(),
        clienteId: clienteEscolhido.id,
        cliente: clienteEscolhido.nome,
        criadoEm: new Date().toISOString().slice(0, 10),
      })
      navigate('/dashboard/projetos')
    } catch (error) {
      console.error('Não foi possível salvar o projeto.', error)
      setErro('Não foi possível salvar o projeto. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const clienteEscolhido = clientes.find((c) => String(c.id) === String(clienteId))

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Cadastro de Projeto" />

        <form className="content-card page-form card shadow-sm p-4" onSubmit={enviarProjeto}>
          <div className="mb-3">
            <label className="form-label" htmlFor="nome">Nome do projeto</label>
            <input id="nome" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="cliente">Cliente</label>
            <select
              id="cliente"
              className="form-select"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={carregando || clientes.length === 0}
              required
            >
              <option value="">{carregando ? 'Carregando clientes...' : 'Selecione um cliente'}</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>

            {clienteEscolhido && (
              <div className="form-text">
                {clienteEscolhido.endereco}{clienteEscolhido.cidade ? ` · ${clienteEscolhido.cidade}` : ''}
              </div>
            )}
          </div>

          {!carregando && clientes.length === 0 && (
            <div className="alert alert-warning py-2" role="alert">
              Nenhum cliente cadastrado ainda.{' '}
              <Link to="/dashboard/clientes/novo" className="alert-link">Cadastre um cliente</Link> antes de criar o projeto.
            </div>
          )}

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={enviando || clientes.length === 0}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default NovoProjeto
