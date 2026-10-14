import axios from 'axios'

// O ViaCEP é um serviço público e gratuito, sem cadastro nem chave. É chamado
// direto do navegador, por isso usa uma instância própria do axios: a padrão
// aponta para /api, que é a nossa API.
const viaCep = axios.create({ baseURL: 'https://viacep.com.br/ws', timeout: 8000 })

export const normalizarCep = (cep) => String(cep || '').replace(/\D/g, '').slice(0, 8)

export const cepValido = (cep) => normalizarCep(cep).length === 8

/** Máscara aplicada enquanto o usuário digita: 06454-000. */
export const mascaraCep = (cep) => {
  const digitos = normalizarCep(cep)
  return digitos.length <= 5 ? digitos : `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

/**
 * Busca o endereço pelo CEP. Devolve null quando o CEP não existe — o ViaCEP
 * responde 200 com { erro: true } nesse caso, e não com um código de erro HTTP.
 */
export const buscarEndereco = async (cep) => {
  const digitos = normalizarCep(cep)

  if (digitos.length !== 8) {
    return null
  }

  const { data } = await viaCep.get(`/${digitos}/json/`)

  if (data.erro) {
    return null
  }

  return {
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: data.uf || '',
  }
}
