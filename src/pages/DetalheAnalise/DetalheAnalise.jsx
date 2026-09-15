import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'
import { getUsuarioLogado } from '../../services/sessao'
import { preverTendencia } from '../../services/previsao'
import SidebarGestor from '../../components/SidebarGestor'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import styles from './DetalheAnalise.module.css'

const ABAS = ['resumo', 'diagnostico', 'planoDeAcao', 'previsao']

const rotuloAba = {
  resumo: 'Resumo',
  diagnostico: 'Diagnóstico',
  planoDeAcao: 'Plano de Ação',
  previsao: 'Previsão',
}

const corTendencia = {
  alta: 'bg-success',
  baixa: 'bg-danger',
  estavel: 'bg-secondary',
}

const corPrioridade = {
  alta: 'bg-danger',
  media: 'bg-warning text-dark',
  baixa: 'bg-secondary',
}

const DetalheAnalise = () => {
  const { id } = useParams()
  const usuario = getUsuarioLogado()
  const [analise, setAnalise] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('resumo')

  useEffect(() => {
    api
      .get(`/analises/${id}`)
      .then((response) => setAnalise(response.data))
      .catch((error) => console.error('Erro ao buscar a análise.', error))
  }, [id])

  const Sidebar = usuario?.papel === 'gestor' ? SidebarGestor : SidebarOperador

  if (!analise) {
    return (
      <div className="d-flex flex-column flex-md-row">
        <Sidebar />
        <div className="flex-grow-1 p-4">
          <p>Carregando análise...</p>
        </div>
      </div>
    )
  }

  const { resultado, serieTemporal } = analise
  const previsao = preverTendencia(serieTemporal || [])

  return (
    <div className="d-flex flex-column flex-md-row">
      <Sidebar />

      <div className="flex-grow-1 p-4">
        <CredentialUser title={analise.titulo} />

        <ul className="nav nav-tabs mb-4">
          {ABAS.map((aba) => (
            <li className="nav-item" key={aba}>
              <button
                type="button"
                className={`nav-link ${abaAtiva === aba ? 'active' : ''}`}
                onClick={() => setAbaAtiva(aba)}
              >
                {rotuloAba[aba]}
              </button>
            </li>
          ))}
        </ul>

        {abaAtiva === 'resumo' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5">{resultado.resumo.titulo}</h2>
              <p>{resultado.resumo.visaoGeral}</p>

              <div className="row mb-3">
                {resultado.indicadores.map((indicador) => (
                  <div className="col-6 col-md-3 mb-3" key={indicador.nome}>
                    <div className={styles.indicador}>
                      <div className="text-muted small">{indicador.nome}</div>
                      <div className="h5 mb-1">
                        {indicador.valor} {indicador.unidade}
                      </div>
                      <span className={`badge ${corTendencia[indicador.tendencia] || 'bg-secondary'}`}>
                        {indicador.tendencia}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="h6">Destaques</h3>
              <ul className="mb-0">
                {resultado.resumo.destaques.map((destaque, i) => (
                  <li key={i}>{destaque}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {abaAtiva === 'diagnostico' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <p className="mb-0">{resultado.diagnostico}</p>
            </div>
          </div>
        )}

        {abaAtiva === 'planoDeAcao' && (
          <div className="card shadow-sm">
            <div className="card-body">
              {resultado.planoDeAcao.map((item, i) => (
                <div key={i} className={i < resultado.planoDeAcao.length - 1 ? 'mb-3 pb-3 border-bottom' : 'mb-0'}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h3 className="h6 mb-1">{item.titulo}</h3>
                    <span className={`badge ${corPrioridade[item.prioridade] || 'bg-secondary'} text-capitalize`}>
                      {item.prioridade}
                    </span>
                  </div>
                  <p className="mb-0 text-muted">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'previsao' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-2">Método: {previsao.metodo}</p>
              <p>
                Tendência prevista: <strong className="text-capitalize">{previsao.tendencia}</strong>
              </p>

              {previsao.valoresPrevistos.length > 0 ? (
                <>
                  <p className="mb-2">Próximos períodos (com base na série enviada):</p>
                  <ul className="mb-0">
                    {previsao.valoresPrevistos.map((valor, i) => (
                      <li key={i}>
                        Período {serieTemporal.length + i + 1}: {valor}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted mb-0">Dados insuficientes para calcular uma previsão.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetalheAnalise
