import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { mascaraTelefone, normalizarTelefone, telefoneValido } from '../../services/formatos'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const EditarCliente = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState({
    nome: '',
    documento: '',
    responsavel: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
  })
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get(`/clientes/${id}`)
      .then((response) => setCliente(response.data))
      .catch((error) => {
        console.error('Erro ao buscar o cliente.', error)
        setErro('Não foi possível carregar o cliente solicitado.')
      })
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setCliente((prev) => ({ ...prev, [name]: value }))
  }

  const atualizarCliente = async (e) => {
    e.preventDefault()
    setErro('')

    if (cliente.telefone && !telefoneValido(cliente.telefone)) {
      setErro('Telefone inválido. Use DDD + número, como (11) 3322-4455.')
      return
    }

    setEnviando(true)

    try {
      const atualizado = {
        ...cliente,
        nome: cliente.nome.trim(),
        endereco: cliente.endereco.trim(),
        telefone: normalizarTelefone(cliente.telefone),
      }
      await api.put(`/clientes/${id}`, atualizado)

      // Os projetos guardam o nome do cliente para aparecer na listagem,
      // então o nome precisa ser atualizado também nos projetos ligados.
      const projetos = await api.get('/projetos', { params: { clienteId: id } })
      await Promise.all(
        projetos.data
          .filter((p) => String(p.clienteId) === String(id))
          .map((p) => api.put(`/projetos/${p.id}`, { ...p, cliente: atualizado.nome })),
      )

      navigate('/dashboard/clientes')
    } catch (error) {
      console.error('Não foi possível atualizar o cliente.', error)
      setErro('Não foi possível atualizar o cliente. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Edição de Cliente" />

        {carregando ? (
          <p className="text-muted">Carregando cliente...</p>
        ) : !cliente.id && erro ? (
          <div className="alert alert-danger" role="alert">{erro}</div>
        ) : (
          <form className="content-card page-form card shadow-sm p-4" onSubmit={atualizarCliente}>
            <div className="mb-3">
              <label className="form-label" htmlFor="nome">Nome do cliente</label>
              <input id="nome" className="form-control" name="nome" value={cliente.nome} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="documento">CNPJ / CPF</label>
              <input id="documento" className="form-control" name="documento" value={cliente.documento || ''} onChange={handleChange} />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="responsavel">Responsável</label>
              <input id="responsavel" className="form-control" name="responsavel" value={cliente.responsavel || ''} onChange={handleChange} />
            </div>

            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label" htmlFor="telefone">Telefone</label>
                <input
                id="telefone"
                className="form-control"
                name="telefone"
                value={mascaraTelefone(cliente.telefone || '')}
                onChange={handleChange}
                placeholder="(11) 3322-4455"
                inputMode="tel"
              />
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label" htmlFor="email">E-mail</label>
                <input id="email" type="email" className="form-control" name="email" value={cliente.email || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="endereco">Endereço de entrega</label>
              <input id="endereco" className="form-control" name="endereco" value={cliente.endereco || ''} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="cidade">Cidade</label>
              <input id="cidade" className="form-control" name="cidade" value={cliente.cidade || ''} onChange={handleChange} required />
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

export default EditarCliente
