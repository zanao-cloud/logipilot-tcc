// Regras das entregas usadas tanto pelo operador quanto pelo motorista.
// Os KPIs do motorista saem destes cálculos, e não de números fixos: cada
// entrega registrada muda a quilometragem, a pontualidade e o progresso do dia.

export const STATUS = {
  pendente: { rotulo: 'Pendente', cor: 'bg-warning text-dark', icone: 'fa-clock' },
  entregue: { rotulo: 'Entregue', cor: 'bg-success', icone: 'fa-circle-check' },
  ausente: { rotulo: 'Ninguém no local', cor: 'bg-danger', icone: 'fa-house-circle-xmark' },
}

export const hojeISO = () => new Date().toISOString().slice(0, 10)

export const statusInfo = (status) => STATUS[status] || STATUS.pendente

export const foiConcluida = (entrega) => entrega.status === 'entregue' || entrega.status === 'ausente'

/** Conferência de carga: o motorista confirmou que pegou o pacote na van. */
export const foiConferida = (entrega) => Boolean(entrega.conferidaEm)

/** A foto do comprovante é servida pela própria API, pelo id da entrega. */
export const urlDoComprovante = (entrega) => `/api/entregas/${entrega.id}/comprovante`

/** Ordena pela sequência definida pelo operador ou pela otimização de rota. */
export const ordenarEntregas = (entregas) => [...entregas].sort((a, b) => {
  const ordemA = Number(a.ordem) || 0
  const ordemB = Number(b.ordem) || 0
  if (ordemA !== ordemB) return ordemA - ordemB
  return String(a.criadoEm || '').localeCompare(String(b.criadoEm || ''))
})

/** "14:35" a partir do horário em que o motorista registrou a entrega. */
export const horaDaConclusao = (entrega) => {
  if (!entrega.concluidaEm) return ''
  const data = new Date(entrega.concluidaEm)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const minutosDoHorario = (horario) => {
  if (!/^\d{2}:\d{2}$/.test(String(horario || ''))) return null
  const [hora, minuto] = horario.split(':').map(Number)
  return hora * 60 + minuto
}

/** A entrega é pontual quando foi registrada até o fim da janela combinada. */
export const foiPontual = (entrega) => {
  if (entrega.status !== 'entregue' || !entrega.concluidaEm) return false

  const limite = minutosDoHorario(entrega.janelaFim)
  if (limite === null) return true

  const data = new Date(entrega.concluidaEm)
  if (Number.isNaN(data.getTime())) return true

  return data.getHours() * 60 + data.getMinutes() <= limite
}

/** Todos os números mostrados na página do motorista saem daqui. */
export const calcularKpis = (entregas) => {
  const total = entregas.length
  const entregues = entregas.filter((e) => e.status === 'entregue')
  const ausentes = entregas.filter((e) => e.status === 'ausente')
  const concluidas = entregues.length + ausentes.length
  const pendentes = total - concluidas

  // A quilometragem conta toda entrega visitada, inclusive aquelas em que
  // não havia ninguém no local: o trajeto foi percorrido do mesmo jeito.
  const kmRodados = entregas
    .filter(foiConcluida)
    .reduce((soma, entrega) => soma + (Number(entrega.distanciaKm) || 0), 0)

  const kmPlanejados = entregas.reduce((soma, entrega) => soma + (Number(entrega.distanciaKm) || 0), 0)

  const pendentesDoDia = entregas.filter((e) => !foiConcluida(e))
  const conferidas = pendentesDoDia.filter(foiConferida).length
  const volumes = entregas.reduce((soma, e) => soma + (Number(e.volumes) || 1), 0)

  const noPrazo = entregues.filter(foiPontual).length
  const pontualidade = entregues.length > 0 ? Math.round((noPrazo / entregues.length) * 100) : null
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0

  return {
    total,
    entregues: entregues.length,
    ausentes: ausentes.length,
    concluidas,
    pendentes,
    kmRodados: Math.round(kmRodados * 10) / 10,
    kmPlanejados: Math.round(kmPlanejados * 10) / 10,
    noPrazo,
    pontualidade,
    progresso,
    volumes,
    conferidas,
    aConferir: pendentesDoDia.length - conferidas,
  }
}

export const linkDoMapa = (entrega) => {
  const destino = [entrega.endereco, entrega.cidade].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`
}
