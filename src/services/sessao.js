const CHAVE = 'logipilot_usuario'

export const salvarUsuarioLogado = (usuario) => {
  localStorage.setItem(CHAVE, JSON.stringify(usuario))
}

export const getUsuarioLogado = () => {
  const dados = localStorage.getItem(CHAVE)

  if (!dados) return null

  try {
    return JSON.parse(dados)
  } catch {
    // Uma sessão corrompida não deve impedir o carregamento da aplicação.
    localStorage.removeItem(CHAVE)
    return null
  }
}

export const logout = () => {
  localStorage.removeItem(CHAVE)
}
