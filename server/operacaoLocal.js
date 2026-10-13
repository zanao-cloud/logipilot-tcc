// Diagnóstico da operação sem IA, a partir dos números que o próprio sistema
// registrou. É a reserva usada quando não há chave da Groq ou quando a chamada
// ao modelo falha, no mesmo formato que a análise de arquivos devolve.

const numero = (valor) => {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

const porcentagem = (valor) => (valor === null || valor === undefined ? '—' : String(valor))

export const diagnosticarOperacaoLocal = (relatorio) => {
  const totais = relatorio.totais || {}
  const porMotorista = relatorio.porMotorista || []
  const porCliente = relatorio.porCliente || []

  const pontualidade = totais.pontualidade
  const visitadas = numero(totais.entregues) + numero(totais.ausentes)
  const taxaDeAusencia = visitadas > 0
    ? Math.round((numero(totais.ausentes) / visitadas) * 100)
    : null

  // O score pune atraso e porta fechada, que são os dois jeitos de uma entrega
  // consumir combustível sem gerar resultado.
  const score = Math.max(0, Math.min(100, Math.round(
    (pontualidade === null ? 70 : pontualidade) - (taxaDeAusencia === null ? 0 : taxaDeAusencia),
  )))

  const piorCliente = porCliente.find((c) => numero(c.ausentes) > 0)
  const piorMotorista = [...porMotorista]
    .filter((m) => m.pontualidade !== null && m.pontualidade !== undefined)
    .sort((a, b) => numero(a.pontualidade) - numero(b.pontualidade))[0]

  const gargalos = []
  if (taxaDeAusencia !== null && taxaDeAusencia > 0) {
    gargalos.push({
      titulo: 'Entregas sem ninguém no local',
      descricao: 'Parte das visitas termina sem entrega, com o trajeto já percorrido.',
      severidade: taxaDeAusencia >= 20 ? 'alta' : taxaDeAusencia >= 10 ? 'media' : 'baixa',
      evidencia: `${totais.ausentes} de ${visitadas} visitas (${taxaDeAusencia}%) não encontraram ninguém.`,
      impacto: 'Combustível e tempo de rota gastos sem concluir a entrega.',
    })
  }
  if (pontualidade !== null && pontualidade !== undefined && pontualidade < 90) {
    gargalos.push({
      titulo: 'Pontualidade abaixo da janela combinada',
      descricao: 'Parte das entregas é registrada depois do horário acordado com o cliente.',
      severidade: pontualidade < 70 ? 'alta' : 'media',
      evidencia: `${totais.noPrazo} de ${totais.entregues} entregas dentro da janela (${pontualidade}%).`,
      impacto: 'Risco de recusa na porta e de desgaste com o cliente.',
    })
  }
  if (gargalos.length === 0) {
    gargalos.push({
      titulo: 'Sem gargalo evidente no período',
      descricao: 'Os indicadores do período não apontam problema relevante.',
      severidade: 'baixa',
      evidencia: `${totais.entregas} entrega(s) registradas no período.`,
      impacto: 'Nenhum impacto identificado com os dados disponíveis.',
    })
  }

  return {
    resumo: {
      titulo: 'Operação de entregas',
      visaoGeral: `No período de ${relatorio.de} a ${relatorio.ate} foram registradas `
        + `${totais.entregas} entrega(s): ${totais.entregues} concluída(s), `
        + `${totais.ausentes} sem ninguém no local e ${totais.pendentes} ainda pendente(s). `
        + `A frota rodou ${totais.kmRodados} km nas paradas visitadas.`,
      periodo: `${relatorio.de} a ${relatorio.ate}`,
      destaques: [
        `Pontualidade de ${porcentagem(pontualidade)}%.`,
        `${totais.volumes} volume(s) transportados.`,
        `${totais.kmRodados} km rodados.`,
        piorCliente
          ? `${piorCliente.cliente} lidera as ausências (${piorCliente.ausentes}).`
          : 'Nenhuma ausência registrada no período.',
      ],
    },
    indicadores: [
      { nome: 'Entregas no período', valor: String(totais.entregas), unidade: 'entregas', tendencia: 'estavel', situacao: 'neutra' },
      { nome: 'Pontualidade', valor: porcentagem(pontualidade), unidade: '%', tendencia: 'estavel', situacao: pontualidade !== null && pontualidade >= 90 ? 'boa' : 'atencao' },
      { nome: 'Taxa de ausência', valor: porcentagem(taxaDeAusencia), unidade: '%', tendencia: 'estavel', situacao: taxaDeAusencia !== null && taxaDeAusencia > 10 ? 'critica' : 'boa' },
      { nome: 'Km rodados', valor: String(totais.kmRodados), unidade: 'km', tendencia: 'estavel', situacao: 'neutra' },
      { nome: 'Volumes transportados', valor: String(totais.volumes), unidade: 'volumes', tendencia: 'estavel', situacao: 'neutra' },
    ],
    diagnostico: {
      scoreSaude: score,
      avaliacaoGeral: `A operação concluiu ${totais.entregues} de ${totais.entregas} entregas no período, `
        + `com pontualidade de ${porcentagem(pontualidade)}% e ${totais.ausentes} visita(s) sem ninguém no local.`,
      fatosObservados: [
        `${totais.entregas} entrega(s) registradas entre ${relatorio.de} e ${relatorio.ate}.`,
        `${totais.noPrazo} entrega(s) dentro da janela combinada.`,
        `${totais.kmRodados} km percorridos nas paradas visitadas.`,
        ...(piorMotorista
          ? [`${piorMotorista.motorista} tem a menor pontualidade da frota (${piorMotorista.pontualidade}%).`]
          : []),
      ],
      hipoteses: [
        'Janelas de entrega curtas demais para o trajeto podem explicar parte dos atrasos.',
        'Ausências concentradas num cliente sugerem horário de funcionamento incompatível com a janela.',
      ],
    },
    gargalos,
    oportunidades: [
      {
        titulo: 'Combinar a janela com o horário real do cliente',
        descricao: 'Ajustar a janela dos clientes com mais ausência para o período em que há alguém no local.',
        impactoPotencial: 'Menos visitas perdidas e menos reentregas.',
        esforco: 'baixo',
      },
      {
        titulo: 'Usar a otimização de rota em todas as rotas',
        descricao: 'Sequenciar as paradas por região e janela reduz quilometragem e atraso.',
        impactoPotencial: 'Redução de km rodados por entrega.',
        esforco: 'baixo',
      },
    ],
    planoDeAcao: [
      {
        titulo: 'Revisar a janela dos clientes com ausência',
        descricao: 'Confirmar com cada cliente o horário em que há alguém para receber.',
        prioridade: taxaDeAusencia !== null && taxaDeAusencia > 10 ? 'alta' : 'media',
        prazo: '15 dias',
        resultadoEsperado: 'Queda na taxa de ausência.',
      },
      {
        titulo: 'Acompanhar a pontualidade por motorista',
        descricao: 'Comparar o indicador por motorista e entender os casos fora da janela.',
        prioridade: 'media',
        prazo: '30 dias',
        resultadoEsperado: 'Pontualidade acima de 90%.',
      },
    ],
    limitacoes: [
      'A análise usa apenas as entregas registradas no sistema no período escolhido.',
      'Entregas pendentes ainda não têm desfecho e não entram na pontualidade.',
      'A quilometragem é a estimativa informada pelo operador, não a medida pelo veículo.',
    ],
  }
}
