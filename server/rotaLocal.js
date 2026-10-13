// Sequenciamento de rota sem IA. É a reserva usada quando não há chave da Groq
// configurada ou quando a chamada ao modelo falha, para que o botão "Otimizar
// entregas" nunca deixe o motorista sem resposta.

const normalizar = (texto) => String(texto || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()

const emMinutos = (horario) => {
  if (!/^\d{2}:\d{2}$/.test(String(horario || ''))) return 24 * 60
  const [hora, minuto] = String(horario).split(':').map(Number)
  return hora * 60 + minuto
}

/**
 * A ordem segue três critérios, nesta hierarquia:
 * 1. entregas da mesma região ficam juntas, para não repetir deslocamento;
 * 2. a região com a janela que fecha primeiro é visitada primeiro;
 * 3. dentro da região, prioridade alta na frente, depois a janela mais curta
 *    e por fim a parada mais próxima.
 */
export const otimizarRotaLocal = (entregas) => {
  const regioes = new Map()

  entregas.forEach((entrega) => {
    const chave = normalizar(entrega.cidade) || 'sem regiao'
    if (!regioes.has(chave)) regioes.set(chave, [])
    regioes.get(chave).push(entrega)
  })

  const ordenadas = [...regioes.entries()]
    .map(([chave, paradas]) => ({
      chave,
      paradas: [...paradas].sort((a, b) => {
        const prioridade = (entrega) => (entrega.prioridade === 'alta' ? 0 : 1)
        if (prioridade(a) !== prioridade(b)) return prioridade(a) - prioridade(b)

        const fimA = emMinutos(a.janelaFim)
        const fimB = emMinutos(b.janelaFim)
        if (fimA !== fimB) return fimA - fimB

        return (Number(a.distanciaKm) || 0) - (Number(b.distanciaKm) || 0)
      }),
    }))
    .sort((a, b) => {
      const limite = (regiao) => Math.min(...regiao.paradas.map((p) => emMinutos(p.janelaFim)))
      return limite(a) - limite(b)
    })

  const sequencia = ordenadas.flatMap((regiao) => regiao.paradas)
  const comPrioridade = sequencia.filter((entrega) => entrega.prioridade === 'alta').length

  const justificativa = `Sequência montada por região: ${ordenadas.map((r) => `${r.paradas[0].cidade || 'sem região'} (${r.paradas.length})`).join(', ')}. `
    + 'As regiões cuja janela fecha mais cedo vêm primeiro e, dentro de cada uma, '
    + `as paradas seguem por prioridade e horário limite${comPrioridade > 0 ? `, com ${comPrioridade} entrega(s) de prioridade alta na frente` : ''}.`

  return {
    ordem: sequencia.map((entrega) => entrega.id),
    justificativa,
    paradas: sequencia.map((entrega, indice) => ({
      id: entrega.id,
      motivo: `${indice + 1}ª parada — ${entrega.cidade || 'região não informada'}, janela até ${entrega.janelaFim}.`,
    })),
    origem: 'local',
  }
}
