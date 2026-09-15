const CHAVE = 'logipilot_usuario'

export const salvarUsuarioLogado = (usuario) => {
  localStorage.setItem(CHAVE, JSON.stringify(usuario))
}

export const getUsuarioLogado = () => {
  const dados = localStorage.getItem(CHAVE)
  return dados ? JSON.parse(dados) : null
}

export const logout = () => {
  localStorage.removeItem(CHAVE)
}
