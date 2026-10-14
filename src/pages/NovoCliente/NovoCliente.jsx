import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { mascaraTelefone, normalizarTelefone, telefoneValido } from '../../services/formatos'
import { buscarEndereco, cepValido, mascaraCep, normalizarCep } from '../../services/cep'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const NovoCliente = () => {
  const [cliente, setCliente] = useState({
    nome: '',
    documento: '',
    responsavel: '',
    telefone: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState('')
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setCliente((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Assim que o CEP fica completo, busca o endereço no ViaCEP e preenche o
   * resto. O número e o complemento continuam por conta do usuário, porque o
   * CEP não os informa.
   */
  const preencherPeloCep = async (valor) => {
    setCliente((prev) => ({ ...prev, cep: mascaraCep(valor) }))
    setAvisoCep('')

    if (!cepValido(valor)) {
      return
    }

    setBuscandoCep(true)

    try {
      const endereco = await buscarEndereco(valor)

      if (!endereco) {
        setAvisoCep('CEP não encontrado. Preencha o endereço à mão.')
        return
      }

      setCliente((prev) => ({ ...prev, ...endereco }))
      setAvisoCep('')
    } catch (error) {
      console.error('Não foi possível consultar o CEP.', error)
      setAvisoCep('Não foi possível consultar o CEP agora. Preencha à mão.')
    } finally {
      setBuscandoCep(false)
    }
  }

  const enviarCliente = async (e) => {
    e.preventDefault()
    setErro('')

    if (!cepValido(cliente.cep)) {
      setErro('CEP inválido. Informe os 8 dígitos.')
      return
    }

    if (cliente.telefone && !telefoneValido(cliente.telefone)) {
      setErro('Telefone inválido. Use DDD + número, como (11) 3322-4455.')
      return
    }

    setEnviando(true)

    try {
      await api.post('/clientes', {
        ...cliente,
        nome: cliente.nome.trim(),
        telefone: normalizarTelefone(cliente.telefone),
        email: cliente.email.trim().toLowerCase(),
        cep: normalizarCep(cliente.cep),
        uf: cliente.uf.trim().toUpperCase(),
        criadoEm: new Date().toISOString().slice(0, 10),
      })

      navigate('/dashboard/clientes')
    } catch (error) {
      console.error('Não foi possível salvar o cliente.', error)
      setErro(error.response?.data?.erro || 'Não foi possível salvar o cliente. Tente novamente.')
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
              <input
                id="telefone"
                className="form-control"
                name="telefone"
                value={mascaraTelefone(cliente.telefone)}
                onChange={handleChange}
                placeholder="(11) 3322-4455"
                inputMode="tel"
              />
            </div>
            <div className="col-sm-6 mb-3">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="form-control" name="email" value={cliente.email} onChange={handleChange} />
            </div>
          </div>

          <hr className="my-3" />
          <h2 className="h6 mb-3">Endereço de entrega</h2>

          <div className="row">
            <div className="col-sm-5 mb-3">
              <label className="form-label" htmlFor="cep">CEP</label>
              <input
                id="cep"
                className="form-control"
                value={cliente.cep}
                onChange={(e) => preencherPeloCep(e.target.value)}
                placeholder="06454-000"
                inputMode="numeric"
                maxLength={9}
                required
              />
              <div className="form-text">
                {buscandoCep ? 'Buscando endereço...' : 'O endereço é preenchido sozinho.'}
              </div>
            </div>
            <div className="col-sm-7 mb-3">
              <label className="form-label" htmlFor="logradouro">Logradouro</label>
              <input id="logradouro" className="form-control" name="logradouro" value={cliente.logradouro} onChange={handleChange} required />
            </div>
          </div>

          {avisoCep && <div className="alert alert-warning py-2" role="alert">{avisoCep}</div>}

          <div className="row">
            <div className="col-sm-4 mb-3">
              <label className="form-label" htmlFor="numero">Número</label>
              <input id="numero" className="form-control" name="numero" value={cliente.numero} onChange={handleChange} required />
            </div>
            <div className="col-sm-8 mb-3">
              <label className="form-label" htmlFor="complemento">Complemento</label>
              <input id="complemento" className="form-control" name="complemento" value={cliente.complemento} onChange={handleChange} placeholder="Sala, bloco, galpão..." />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-5 mb-3">
              <label className="form-label" htmlFor="bairro">Bairro</label>
              <input id="bairro" className="form-control" name="bairro" value={cliente.bairro} onChange={handleChange} required />
            </div>
            <div className="col-sm-5 mb-3">
              <label className="form-label" htmlFor="cidade">Cidade</label>
              <input id="cidade" className="form-control" name="cidade" value={cliente.cidade} onChange={handleChange} required />
            </div>
            <div className="col-sm-2 mb-3">
              <label className="form-label" htmlFor="uf">UF</label>
              <input
                id="uf"
                className="form-control text-uppercase"
                name="uf"
                value={cliente.uf}
                onChange={handleChange}
                maxLength={2}
                required
              />
            </div>
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
