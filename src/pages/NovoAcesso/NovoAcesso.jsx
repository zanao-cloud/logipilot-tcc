import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SidebarGestor from '../../components/SidebarGestor'
import CredentialUser from '../../components/CredentialUser'

const NovoAcesso = () => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [papel, setPapel] = useState('operador')
  const [telefone, setTelefone] = useState('')
  const [placa, setPlaca] = useState('')
  const navigate = useNavigate()

  const escolherPapel = (e) => {
    setPapel(e.target.value)
  }

  const enviarAcesso = async (e) => {
    e.preventDefault()

    const acesso = {
      nome,
      email,
      senha,
      papel,
      telefone,
      ...(papel === 'motorista' ? { placa } : {}),
    }

    try {
      const response = await api.post('/usuarios', acesso)
      alert(`Acesso de ${response.data.nome} cadastrado com sucesso!`)
      navigate('/dashboard/acessos')
    } catch (error) {
      console.error('Não foi possível salvar o acesso.', error)
      alert('Não foi possível salvar o acesso.')
    }
  }

  return (
    <div className="d-flex">
      <SidebarGestor />

      <div className="flex-grow-1 p-4">
        <CredentialUser title="Cadastro de Acesso" />

        <form className="card shadow-sm p-4" style={{ maxWidth: 480 }} onSubmit={enviarAcesso}>
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Papel</label>
            <select className="form-select" value={papel} onChange={escolherPapel}>
              <option value="operador">Operador</option>
              <option value="motorista">Motorista</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Telefone</label>
            <input
              className="form-control"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>

          {papel === 'motorista' && (
            <div className="mb-3">
              <label className="form-label">Placa do veículo</label>
              <input className="form-control" value={placa} onChange={(e) => setPlaca(e.target.value)} required />
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100">
            Salvar
          </button>
        </form>
      </div>
    </div>
  )
}

export default NovoAcesso
