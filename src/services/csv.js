const detectarSeparador = (cabecalho) => {
  const candidatos = [',', ';', '\t']
  return candidatos.reduce((melhor, separador) => (
    cabecalho.split(separador).length > cabecalho.split(melhor).length ? separador : melhor
  ), ',')
}

const separarCampos = (linha, separador) => {
  const campos = []
  let campo = ''
  let entreAspas = false

  for (let indice = 0; indice < linha.length; indice += 1) {
    const caractere = linha[indice]

    if (caractere === '"') {
      if (entreAspas && linha[indice + 1] === '"') {
        campo += '"'
        indice += 1
      } else {
        entreAspas = !entreAspas
      }
    } else if (caractere === separador && !entreAspas) {
      campos.push(campo.trim())
      campo = ''
    } else {
      campo += caractere
    }
  }

  campos.push(campo.trim())
  return campos
}

export const extrairSerieTemporalDoCsv = (conteudo) => {
  const linhas = conteudo
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)

  if (linhas.length < 3) {
    throw new Error('O CSV precisa ter um cabeçalho e pelo menos dois períodos com valores numéricos.')
  }

  const separador = detectarSeparador(linhas[0])
  const valores = linhas.slice(1).map((linha) => {
    const valor = separarCampos(linha, separador)[1]?.replace(',', '.')
    return valor ? Number(valor) : Number.NaN
  }).filter((valor) => Number.isFinite(valor))

  if (valores.length < 2) {
    throw new Error('Não foram encontrados pelo menos dois valores numéricos na segunda coluna do CSV.')
  }

  return valores
}
