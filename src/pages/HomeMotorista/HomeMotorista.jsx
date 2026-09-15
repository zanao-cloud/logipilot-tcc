import { useNavigate } from 'react-router-dom'
import { getUsuarioLogado, logout } from '../../services/sessao'
import styles from './HomeMotorista.module.css'

const gerarSeed = (texto) => {
  let soma = 0
  for (let i = 0; i < texto.length; i++) {
    soma += texto.charCodeAt(i)
  }
  return soma
}

const entregasDoDia = [
  { id: 1, cliente: 'Mercado Azul', endereco: 'Rua das Flores, 120', status: 'Entregue' },
  { id: 2, cliente: 'Loja Rápida', endereco: 'Av. Brasil, 850', status: 'Entregue' },
  { id: 3, cliente: 'Distribuidora Sul', endereco: 'Rua Palmeiras, 40', status: 'Pendente' },
  { id: 4, cliente: 'Comércio Vieira', endereco: 'Rua Nova, 12', status: 'Pendente' },
]

const HomeMotorista = () => {
  const usuario = getUsuarioLogado()
  const navigate = useNavigate()
  const seed = gerarSeed(usuario?.id || 'motorista')

  const kpis = {
    entregasHoje: 4 + (seed % 6),
    pontualidade: 85 + (seed % 12),
    kmRodados: 40 + (seed % 30),
  }

  const sair = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <img src="/logo.png" alt="LogiPilot" className={styles.logo} />
        <button className="btn btn-outline-light btn-sm" onClick={sair}>
          Sair
        </button>
      </header>

      <main className="p-3">
        <h1 className="h5">Olá, {usuario ? usuario.nome.split(' ')[0] : 'Motorista'}!</h1>
        <p className="text-muted small">KPIs estimados para fins de demonstração.</p>

        <div className="row mb-3">
          <div className="col-4">
            <div className={styles.kpi}>
              <div className="h4 mb-0">{kpis.entregasHoje}</div>
              <div className="small text-muted">Entregas hoje</div>
            </div>
          </div>
          <div className="col-4">
            <div className={styles.kpi}>
              <div className="h4 mb-0">{kpis.pontualidade}%</div>
              <div className="small text-muted">Pontualidade</div>
            </div>
          </div>
          <div className="col-4">
            <div className={styles.kpi}>
              <div className="h4 mb-0">{kpis.kmRodados}</div>
              <div className="small text-muted">Km rodados</div>
            </div>
          </div>
        </div>

        <h2 className="h6">Entregas do dia</h2>
        <ul className="list-group">
          {entregasDoDia.map((entrega) => (
            <li key={entrega.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold">{entrega.cliente}</div>
                <div className="small text-muted">{entrega.endereco}</div>
              </div>
              <span className={`badge ${entrega.status === 'Entregue' ? 'bg-success' : 'bg-warning text-dark'}`}>
                {entrega.status}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default HomeMotorista
