#!/usr/bin/env node
/**
 * Gera o script Flyway V2__dados_iniciais.sql lendo o banco MySQL que o
 * projeto usava antes de migrar para o Microsoft SQL Server.
 *
 * Os ids são preservados, então as chaves estrangeiras continuam apontando
 * para as mesmas linhas. Como as colunas de id são IDENTITY no SQL Server,
 * o script liga o SET IDENTITY_INSERT para conseguir gravar os ids originais.
 *
 * Uso (a partir da raiz do projeto, com o MySQL ainda no ar):
 *   node backend/ferramentas/migrar-mysql-para-sqlserver.mjs [saida.sql]
 *
 * É uma ferramenta de uma vez só: serviu para a troca de banco e fica no
 * repositório documentando como ela foi feita.
 */

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DESTINO = process.argv[2]
  || join(RAIZ, 'backend/src/main/resources/db/migration/V2__dados_iniciais.sql')

const MYSQL = {
  usuario: process.env.MYSQL_USUARIO || 'logipilot',
  senha: process.env.MYSQL_SENHA || 'logipilot',
  banco: process.env.MYSQL_BANCO || 'logipilot',
}

/**
 * Lê uma tabela do MySQL. O separador é a tabulação e o modo --raw evita que
 * o cliente escape quebras de linha, que atrapalhariam o JSON das análises.
 */
const lerTabela = (sql) => {
  const saida = execFileSync('mysql', [
    '-u', MYSQL.usuario, `-p${MYSQL.senha}`, MYSQL.banco,
    '--batch', '--raw', '--default-character-set=utf8mb4', '-e', sql,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

  const linhas = saida.split('\n').filter((l) => l.length > 0)
  const colunas = linhas.shift().split('\t')

  return linhas.map((linha) => Object.fromEntries(
    linha.split('\t').map((valor, i) => [colunas[i], valor === 'NULL' ? null : valor]),
  ))
}

/** Escapa um texto para dentro de uma string T-SQL, com prefixo N de unicode. */
const s = (valor) => (valor === null || valor === undefined || valor === ''
  ? 'NULL'
  : `N'${String(valor).replace(/'/g, "''")}'`)

const num = (valor, padrao = '0') => (valor === null || valor === '' ? padrao : String(valor))

/**
 * O MySQL guardava os instantes já em UTC, sem fuso na coluna. No SQL Server a
 * coluna é DATETIMEOFFSET, então o deslocamento precisa ir explícito — sem ele
 * o servidor assumiria o fuso dele e os horários andariam.
 */
const instante = (valor) => (valor === null || valor === '' ? 'NULL' : `N'${valor}+00:00'`)

const bloco = (tabela, colunas, linhas, montar) => {
  if (linhas.length === 0) {
    return [`-- Nenhum registro em ${tabela}.`, '']
  }

  return [
    `SET IDENTITY_INSERT ${tabela} ON;`,
    `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES`,
    linhas.map(montar).join(',\n') + ';',
    `SET IDENTITY_INSERT ${tabela} OFF;`,
    '',
  ]
}

const usuarios = lerTabela('SELECT id, nome, email, senha, papel, telefone, placa FROM usuario ORDER BY id')
const clientes = lerTabela('SELECT id, nome, documento, responsavel, telefone, email, endereco, cidade, criado_em FROM cliente ORDER BY id')
const projetos = lerTabela('SELECT id, nome, cliente_id, criado_em FROM projeto ORDER BY id')
// As entregas reagendadas apontam para outra entrega, então as que não têm
// origem precisam ser inseridas antes — daí a ordenação pela referência.
const entregas = lerTabela(`SELECT id, motorista_id, cliente_id, codigo, volumes, conferida_em,
    endereco, cidade, janela_inicio, janela_fim, distancia_km, prioridade, observacoes_operador,
    data, ordem, status, observacoes, recebido_por, comprovante_arquivo, reagendada_de_id,
    concluida_em, criado_em
  FROM entrega ORDER BY CASE WHEN reagendada_de_id IS NULL THEN 0 ELSE 1 END, id`)
const analises = lerTabela('SELECT id, titulo, projeto_id, criado_por_id, status, criado_em, serie_temporal, fontes, resultado FROM analise ORDER BY id')

const partes = [
  '-- Dados migrados do MySQL para o Microsoft SQL Server.',
  '-- Gerado por backend/ferramentas/migrar-mysql-para-sqlserver.mjs.',
  '--',
  '-- Os ids originais são preservados para as chaves estrangeiras continuarem',
  '-- válidas, por isso o SET IDENTITY_INSERT em cada tabela.',
  '',
  ...bloco('usuario', ['id', 'nome', 'email', 'senha', 'papel', 'telefone', 'placa'], usuarios,
    (u) => `  (${u.id}, ${s(u.nome)}, ${s(u.email)}, ${s(u.senha)}, ${s(u.papel)}, ${s(u.telefone)}, ${s(u.placa)})`),

  ...bloco('cliente', ['id', 'nome', 'documento', 'responsavel', 'telefone', 'email', 'endereco', 'cidade', 'criado_em'], clientes,
    (c) => `  (${c.id}, ${s(c.nome)}, ${s(c.documento)}, ${s(c.responsavel)}, ${s(c.telefone)}, `
      + `${s(c.email)}, ${s(c.endereco)}, ${s(c.cidade)}, ${s(c.criado_em)})`),

  ...bloco('projeto', ['id', 'nome', 'cliente_id', 'criado_em'], projetos,
    (p) => `  (${p.id}, ${s(p.nome)}, ${p.cliente_id}, ${s(p.criado_em)})`),

  ...bloco('entrega', ['id', 'motorista_id', 'cliente_id', 'codigo', 'volumes', 'conferida_em',
    'endereco', 'cidade', 'janela_inicio', 'janela_fim', 'distancia_km', 'prioridade',
    'observacoes_operador', 'data', 'ordem', 'status', 'observacoes', 'recebido_por',
    'comprovante_arquivo', 'reagendada_de_id', 'concluida_em', 'criado_em'], entregas,
    (e) => `  (${e.id}, ${e.motorista_id}, ${e.cliente_id}, ${s(e.codigo)}, ${num(e.volumes, '1')}, `
      + `${instante(e.conferida_em)}, ${s(e.endereco)}, ${s(e.cidade)}, ${s(e.janela_inicio)}, `
      + `${s(e.janela_fim)}, ${num(e.distancia_km)}, ${s(e.prioridade)}, ${s(e.observacoes_operador)}, `
      + `${s(e.data)}, ${num(e.ordem, '1')}, ${s(e.status)}, ${s(e.observacoes)}, `
      + `${s(e.recebido_por)}, ${s(e.comprovante_arquivo)}, ${e.reagendada_de_id ?? 'NULL'}, `
      + `${instante(e.concluida_em)}, ${instante(e.criado_em)})`),

  ...bloco('analise', ['id', 'titulo', 'projeto_id', 'criado_por_id', 'status', 'criado_em',
    'serie_temporal', 'fontes', 'resultado'], analises,
    (a) => `  (${a.id}, ${s(a.titulo)}, ${a.projeto_id ?? 'NULL'}, ${a.criado_por_id}, `
      + `${s(a.status)}, ${s(a.criado_em)}, ${s(a.serie_temporal)}, ${s(a.fontes)}, ${s(a.resultado)})`),
]

writeFileSync(DESTINO, partes.join('\n') + '\n', 'utf8')

console.log(`gerado: ${relative(RAIZ, DESTINO)}`)
console.log(`  ${usuarios.length} usuário(s), ${clientes.length} cliente(s), ${projetos.length} projeto(s), `
  + `${entregas.length} entrega(s), ${analises.length} análise(s)`)
