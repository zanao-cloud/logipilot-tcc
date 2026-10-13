// O json-server guarda os dados em texto puro no db.json, então a senha nunca
// é salva como o usuário digitou: guardamos apenas o hash SHA-256 dela.
// crypto.subtle é a API de criptografia nativa do navegador.
export const gerarHash = async (senha) => {
  const dados = new TextEncoder().encode(senha)
  const buffer = await crypto.subtle.digest('SHA-256', dados)

  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const conferirSenha = async (senha, hashSalvo) => {
  return (await gerarHash(senha)) === hashSalvo
}
