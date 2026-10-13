// Formatos brasileiros do cadastro. As mesmas regras valem no Spring
// (dominio/Formatos.java) e no banco (constraints da migração V5) — aqui elas
// existem para avisar o usuário antes de ele enviar o formulário.

/** AAA1234 (antigo) ou AAA1A23 (Mercosul). */
const PLACA = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/

/** DDD + 8 dígitos (fixo) ou DDD + 9 dígitos começando com 9 (celular). */
const TELEFONE = /^[1-9][1-9](9[0-9]{8}|[2-8][0-9]{7})$/

export const normalizarPlaca = (placa) => String(placa || '')
  .replace(/[^A-Za-z0-9]/g, '')
  .toUpperCase()

export const normalizarTelefone = (telefone) => String(telefone || '').replace(/\D/g, '')

export const placaValida = (placa) => PLACA.test(normalizarPlaca(placa))

export const telefoneValido = (telefone) => TELEFONE.test(normalizarTelefone(telefone))

/** Máscara aplicada enquanto o usuário digita: ABC1D23. */
export const mascaraPlaca = (placa) => normalizarPlaca(placa).slice(0, 7)

/** Máscara aplicada enquanto o usuário digita: (11) 93936-9341. */
export const mascaraTelefone = (telefone) => {
  const digitos = normalizarTelefone(telefone).slice(0, 11)

  if (digitos.length <= 2) return digitos
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`

  // Com 11 dígitos o nono vai para o primeiro bloco: (11) 93936-9341.
  const corte = digitos.length === 11 ? 7 : 6

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, corte)}-${digitos.slice(corte)}`
}

/** Usado nas listagens: o banco guarda só os dígitos. */
export const formatarTelefone = (telefone) => {
  const digitos = normalizarTelefone(telefone)
  return digitos ? mascaraTelefone(digitos) : '—'
}

/** Mostra a placa com o traço do padrão antigo; a Mercosul não usa traço. */
export const formatarPlaca = (placa) => {
  const limpa = normalizarPlaca(placa)

  if (!limpa) return '—'
  if (/^[A-Z]{3}[0-9]{4}$/.test(limpa)) return `${limpa.slice(0, 3)}-${limpa.slice(3)}`

  return limpa
}
