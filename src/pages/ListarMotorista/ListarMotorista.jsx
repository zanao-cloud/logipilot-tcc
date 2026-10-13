import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import { calcularKpis, hojeISO } from '../../services/entregas'
import { formatarPlaca, formatarTelefone } from '../../services/formatos'

const ListarMotorista = () => {
  const [motoristas, setMotoristas] = useState([])
  const [entregas, setEntregas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([api.get('/usuarios'), api.get('/entregas')])
      .then(([respostaUsuarios, respostaEntregas]) => {
        setMotoristas(respostaUsuarios.data.filter((u) => u.papel === 'motorista'))
        setEntregas(respostaEntregas.data)
      })
      .catch((error) => {
        console.error('Erro ao carregar os motoristas.', error)
        setErro('Não foi possível carregar os motoristas.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const hoje = hojeISO()
  const entregasDoMotorista = (id) => entregas.filter(
    (e) => String(e.motoristaId) === String(id) && e.data === hoje,
  )

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarOperador />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Motoristas" />

        {erro && <div className="alert alert-warning" role="alert">{erro}</div>}

        <div className="content-card card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">Designação de entregas</h2>
            <p className="mb-0 text-muted">
              O motorista só vê as entregas que você designar aqui. Escolha um motorista para montar a
              rota do dia dele.
            </p>
          </div>
        </div>

        <div className="content-card card shadow-sm">
          <div className="card-body">
            {carregando && <p className="text-muted mb-0">Carregando motoristas...</p>}

            {!carregando && motoristas.length === 0 && (
              <p className="text-muted mb-0">
                Nenhum motorista cadastrado. Peça ao gestor para criar o acesso em Dashboard → Acessos.
              </p>
            )}

            {motoristas.length > 0 && (
              <div className="table-responsive"><table className="table table-hover align-middle mb-0">
                <thead className="table-success">
                  <tr>
                    <th>Motorista</th>
                    <th>Contato</th>
                    <th className="text-center">Entregas hoje</th>
                    <th className="text-center">Pendentes</th>
                    <th className="text-center">Km previstos</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {motoristas.map((motorista) => {
                    const doDia = entregasDoMotorista(motorista.id)
                    const kpis = calcularKpis(doDia)

                    return (
                      <tr key={motorista.id}>
                        <td>
                          <div className="fw-semibold">{motorista.nome}</div>
                          <small className="text-muted">Placa: {formatarPlaca(motorista.placa)}</small>
                        </td>
                        <td>
                          <div>{formatarTelefone(motorista.telefone)}</div>
                          <small className="text-muted">{motorista.email}</small>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-primary">{kpis.total}</span>
                        </td>
                        <td className="text-center">
                          {kpis.pendentes > 0
                            ? <span className="badge bg-warning text-dark">{kpis.pendentes}</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center">{kpis.kmPlanejados > 0 ? `${kpis.kmPlanejados} km` : '—'}</td>
                        <td className="text-end">
                          <Link to={`/operador/motoristas/${motorista.id}`} className="btn btn-sm btn-success">
                            <i className="fas fa-route me-1"></i>Designar entregas
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ListarMotorista
