#!/usr/bin/env node
/**
 * Gera o script Flyway V2__dados_iniciais.sql a partir do antigo db.json.
 *
 * O db.json era o banco do json-server. Este script traduz aquelas coleções
 * para INSERTs do MySQL, trocando os ids de texto ("StA4qrKjoqc", "c1") por ids
 * numéricos e transformando os campos repetidos em chaves estrangeiras.
 *
 * Uso (a partir da raiz do projeto):
 *   node backend/ferramentas/migrar-db-json.mjs [arquivo-de-saida.sql]
 *
 * Atenção: rodar de novo gera hashes BCrypt novos (o salt muda a cada
 * execução). Num banco que já aplicou a V2, isso quebra a checagem do Flyway.
 * O script existe para documentar e refazer a migração do zero, não para ser
 * executado a cada deploy.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ORIGEM = join(RAIZ, 'db.json')
const DESTINO = process.argv[2]
  || join(RAIZ, 'backend/src/main/resources/db/migration/V2__dados_iniciais.sql')

// Hash SHA-256 (sem salt) que o db.json usava para a senha de desenvolvimento.
const SHA256_DE_123456 = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
const SENHA_DE_DESENVOLVIMENTO = '123456'

/** BCrypt via htpasswd, que já vem no macOS — evita instalar dependência só para isto. */
const bcrypt = (senha) => execFileSync('/usr/sbin/htpasswd', ['-bnBC', '10', '', senha])
  .toString()
  .trim()
  .replace(/^:/, '')

/** Escapa um texto para dentro de uma string SQL. */
const s = (valor) => (valor === null || valor === undefined || valor === ''
  ? 'NULL'
  : `'${String(valor).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)

const j = (valor) => (valor === null || valor === undefined ? 'NULL' : s(JSON.stringify(valor)))

const n = (valor, padrao = '0') => (valor === null || valor === undefined || valor === ''
  ? padrao
  : String(valor))

/** "2026-10-13T14:09:38.278Z" vira "2026-10-13 14:09:38.278" (DATETIME do MySQL). */
const dataHora = (valor) => (valor
  ? s(String(valor).replace('T', ' ').replace('Z', '').split('+')[0])
  : 'NULL')

const db = JSON.parse(readFileSync(ORIGEM, 'utf8'))
const partes = [
  '-- Dados migrados do db.json (json-server) para o MySQL.',
  '-- Gerado por backend/ferramentas/migrar-db-json.mjs.',
  '',
]

// --- usuarios ---------------------------------------------------------------
const idsUsuario = {}
partes.push(
  '-- As senhas eram SHA-256 sem salt e não são convertíveis para BCrypt.',
  '-- Os acessos abaixo foram recriados com a mesma senha de desenvolvimento',
  '-- que já valia no db.json. Troque pelo painel antes de qualquer uso real.',
  'INSERT INTO usuario (id, nome, email, senha, papel, telefone, placa) VALUES',
)
partes.push((db.usuarios ?? []).map((u, i) => {
  idsUsuario[u.id] = i + 1

  if (u.senha !== SHA256_DE_123456) {
    console.warn(`  aviso: senha de ${u.email} não é a de desenvolvimento; `
      + 'o acesso será recriado com ela mesmo assim.')
  }

  return `  (${i + 1}, ${s(u.nome)}, ${s(u.email.toLowerCase())}, `
    + `${s(bcrypt(SENHA_DE_DESENVOLVIMENTO))}, ${s(u.papel.toUpperCase())}, `
    + `${s(u.telefone)}, ${s(u.placa)})`
}).join(',\n') + ';', '')

// --- clientes ---------------------------------------------------------------
const idsCliente = {}
partes.push('INSERT INTO cliente (id, nome, documento, responsavel, telefone, email, '
  + 'endereco, cidade, criado_em) VALUES')
partes.push((db.clientes ?? []).map((c, i) => {
  idsCliente[c.id] = i + 1

  return `  (${i + 1}, ${s(c.nome)}, ${s(c.documento)}, ${s(c.responsavel)}, `
    + `${s(c.telefone)}, ${s(c.email)}, ${s(c.endereco)}, ${s(c.cidade)}, ${s(c.criadoEm)})`
}).join(',\n') + ';', '')

// --- projetos ---------------------------------------------------------------
const idsProjeto = {}
partes.push('INSERT INTO projeto (id, nome, cliente_id, criado_em) VALUES')
partes.push((db.projetos ?? []).map((p, i) => {
  idsProjeto[p.id] = i + 1
  return `  (${i + 1}, ${s(p.nome)}, ${idsCliente[p.clienteId]}, ${s(p.criadoEm)})`
}).join(',\n') + ';', '')

// --- entregas ---------------------------------------------------------------
const entregas = db.entregas ?? []
if (entregas.length > 0) {
  partes.push('INSERT INTO entrega (id, motorista_id, cliente_id, endereco, cidade, '
    + 'janela_inicio, janela_fim, distancia_km, prioridade, observacoes_operador, '
    + 'data, ordem, status, observacoes, concluida_em, criado_em) VALUES')
  partes.push(entregas.map((e, i) => `  (${i + 1}, ${idsUsuario[e.motoristaId]}, `
    + `${idsCliente[e.clienteId]}, ${s(e.endereco)}, ${s(e.cidade)}, ${s(e.janelaInicio)}, `
    + `${s(e.janelaFim)}, ${n(e.distanciaKm)}, ${s((e.prioridade ?? 'normal').toUpperCase())}, `
    + `${s(e.observacoesOperador)}, ${s(e.data)}, ${n(e.ordem, '1')}, `
    + `${s((e.status ?? 'pendente').toUpperCase())}, ${s(e.observacoes)}, `
    + `${dataHora(e.concluidaEm)}, ${dataHora(e.criadoEm)})`).join(',\n') + ';', '')
} else {
  partes.push('-- Nenhuma entrega no db.json: a tabela entrega começa vazia.', '')
}

// --- analises ---------------------------------------------------------------
const analises = db.analises ?? []
if (analises.length > 0) {
  partes.push('INSERT INTO analise (id, titulo, projeto_id, criado_por_id, status, '
    + 'criado_em, serie_temporal, fontes, resultado) VALUES')
  partes.push(analises.map((a, i) => {
    const projeto = idsProjeto[a.projetoId]

    return `  (${i + 1}, ${s(a.titulo)}, ${projeto ?? 'NULL'}, ${idsUsuario[a.criadoPorId]}, `
      + `${s(a.status)}, ${s(a.criadoEm)}, ${j(a.serieTemporal ?? [])}, `
      + `${j(a.fontes ?? [])}, ${j(a.resultado)})`
  }).join(',\n') + ';', '')
}

writeFileSync(DESTINO, partes.join('\n') + '\n', 'utf8')

console.log(`gerado: ${relative(RAIZ, DESTINO)}`)
console.log(`  ${Object.keys(idsUsuario).length} usuário(s), ${Object.keys(idsCliente).length} cliente(s), `
  + `${Object.keys(idsProjeto).length} projeto(s), ${entregas.length} entrega(s), `
  + `${analises.length} análise(s)`)
