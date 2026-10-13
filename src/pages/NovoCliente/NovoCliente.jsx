import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const NovoCliente = () => {
  const [cliente, setCliente] = useState({
    nome: '',
    documento: '',
    responsavel: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setCliente((prev) => ({ ...prev, [name]: value }))
  }

  const enviarCliente = async (e) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      const nome = cliente.nome.trim()
      const existentes = await api.get('/clientes')
      const jaCadastrado = existentes.data.some((c) => c.nome.toLowerCase() === nome.toLowerCase())

      if (jaCadastrado) {
        setErro('Já existe um cliente cadastrado com este nome.')
        return
      }

      await api.post('/clientes', {
        nome,
        documento: cliente.documento.trim(),
        responsavel: cliente.responsavel.trim(),
        telefone: cliente.telefone.trim(),
        email: cliente.email.trim().toLowerCase(),
        endereco: cliente.endereco.trim(),
        cidade: cliente.cidade.trim(),
        criadoEm: new Date().toISOString().slice(0, 10),
      })

      navigate('/dashboard/clientes')
    } catch (error) {
      console.error('Não foi possível salvar o cliente.', error)
      setErro('Não foi possível salvar o cliente. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarGestor />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Cadastro de Cliente" />

        <form className="content-card page-form card shadow-sm p-4" onSubmit={enviarCliente}>
          <div className="mb-3">
            <label className="form-label" htmlFor="nome">Nome do cliente</label>
            <input id="nome" className="form-control" name="nome" value={cliente.nome} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="documento">CNPJ / CPF</label>
            <input id="documento" className="form-control" name="documento" value={cliente.documento} onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="responsavel">Responsável</label>
            <input id="responsavel" className="form-control" name="responsavel" value={cliente.responsavel} onChange={handleChange} />
          </div>

          <div className="row">
            <div className="col-sm-6 mb-3">
              <label className="form-label" htmlFor="telefone">Telefone</label>
              <input id="telefone" className="form-control" name="telefone" value={cliente.telefone} onChange={handleChange} />
            </div>
            <div className="col-sm-6 mb-3">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="form-control" name="email" value={cliente.email} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="endereco">Endereço de entrega</label>
            <input id="endereco" className="form-control" name="endereco" value={cliente.endereco} onChange={handleChange} required />
            <div className="form-text">Usado como sugestão ao designar entregas para os motoristas.</div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="cidade">Cidade</label>
            <input id="cidade" className="form-control" name="cidade" value={cliente.cidade} onChange={handleChange} required />
          </div>

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default NovoCliente
