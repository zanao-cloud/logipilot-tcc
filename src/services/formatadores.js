export const formatarData = (data) => {
  if (!data) return '—'

  const dataNormalizada = /^\d{4}-\d{2}-\d{2}$/.test(data) ? `${data}T12:00:00` : data
  const valor = new Date(dataNormalizada)

  if (Number.isNaN(valor.getTime())) return data

  return new Intl.DateTimeFormat('pt-BR').format(valor)
}

// A IA devolve os indicadores como texto e às vezes manda o número cru
// ("2223.55667692308"). Aqui o valor é convertido para o padrão brasileiro,
// com separador de milhar e no máximo duas casas decimais.
export const formatarNumero = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—'

  const texto = String(valor).trim()

  // Qualquer coisa que não seja só número (com sinal, pontos e vírgulas)
  // é devolvida como veio: pode ser "N/A", um intervalo ou um texto.
  if (!/^-?[\d.,]+$/.test(texto) || !/\d/.test(texto)) return texto

  let limpo = texto

  // Com vírgula e ponto juntos, o que aparece por último é o decimal.
  if (limpo.includes(',') && limpo.includes('.')) {
    limpo = limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '')
  } else if (limpo.includes(',')) {
    limpo = limpo.replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3}){2,}$/.test(limpo)) {
    // Dois ou mais grupos de três ("3.322.094") só fazem sentido como
    // separador de milhar. Com um grupo só ("0.465") a leitura correta é
    // decimal, que é como a IA e o JavaScript escrevem números crus.
    limpo = limpo.replace(/\./g, '')
  }

  const numero = Number(limpo)
  if (!Number.isFinite(numero)) return texto

  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(numero)
}
