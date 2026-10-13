#!/usr/bin/env python3
"""
Gera o script Flyway V2__dados_iniciais.sql a partir do antigo db.json.

O db.json era o banco do json-server. Este script traduz aquelas coleções para
INSERTs do MySQL, trocando os ids de texto ("StA4qrKjoqc", "c1") por ids
numéricos e transformando os campos repetidos em chaves estrangeiras.

Uso (a partir da raiz do projeto):
    python3 backend/ferramentas/migrar-db-json.py
"""

import json
import pathlib
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parents[2]
ORIGEM = RAIZ / "db.json"
DESTINO = RAIZ / "backend/src/main/resources/db/migration/V2__dados_iniciais.sql"

# Hash SHA-256 (sem salt) que o db.json usava para a senha de desenvolvimento.
SHA256_DE_123456 = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
SENHA_DE_DESENVOLVIMENTO = "123456"


def bcrypt(senha):
    """BCrypt via htpasswd, que já vem no macOS — evita instalar biblioteca só para isto."""
    saida = subprocess.run(
        ["/usr/sbin/htpasswd", "-bnBC", "10", "", senha],
        capture_output=True, text=True, check=True,
    ).stdout
    return saida.strip().lstrip(":")


def s(valor):
    """Escapa um texto para dentro de uma string SQL."""
    if valor is None or valor == "":
        return "NULL"
    return "'" + str(valor).replace("\\", "\\\\").replace("'", "''") + "'"


def j(valor):
    return "NULL" if valor is None else s(json.dumps(valor, ensure_ascii=False))


def n(valor, padrao="0"):
    return padrao if valor in (None, "") else str(valor)


def datahora(valor):
    """"2026-10-13T14:09:38.278Z" -> "2026-10-13 14:09:38.278" (DATETIME do MySQL)."""
    if not valor:
        return "NULL"
    return s(str(valor).replace("T", " ").replace("Z", "").split("+")[0])


def main():
    if not ORIGEM.exists():
        sys.exit(f"{ORIGEM} não encontrado.")

    db = json.loads(ORIGEM.read_text(encoding="utf-8"))
    partes = [
        "-- Dados migrados do db.json (json-server) para o MySQL.",
        "-- Gerado por backend/ferramentas/migrar-db-json.py.",
        "",
    ]

    # --- usuarios ---------------------------------------------------------
    ids_usuario = {}
    partes += [
        "-- As senhas eram SHA-256 sem salt e não são convertíveis para BCrypt.",
        f"-- Os acessos abaixo foram recriados com a mesma senha de desenvolvimento",
        "-- que já valia no db.json. Troque pelo painel antes de qualquer uso real.",
        "INSERT INTO usuario (id, nome, email, senha, papel, telefone, placa) VALUES",
    ]
    linhas = []
    for i, u in enumerate(db.get("usuarios", []), start=1):
        ids_usuario[u["id"]] = i
        if u.get("senha") != SHA256_DE_123456:
            print(f"  aviso: senha de {u['email']} não é a de desenvolvimento; "
                  f"o acesso será recriado com ela mesmo assim.")
        linhas.append(
            f"  ({i}, {s(u['nome'])}, {s(u['email'].lower())}, {s(bcrypt(SENHA_DE_DESENVOLVIMENTO))}, "
            f"{s(u['papel'].upper())}, {s(u.get('telefone'))}, {s(u.get('placa'))})"
        )
    partes += [",\n".join(linhas) + ";", ""]

    # --- clientes ---------------------------------------------------------
    ids_cliente = {}
    partes.append("INSERT INTO cliente (id, nome, documento, responsavel, telefone, email, "
                  "endereco, cidade, criado_em) VALUES")
    linhas = []
    for i, c in enumerate(db.get("clientes", []), start=1):
        ids_cliente[c["id"]] = i
        linhas.append(
            f"  ({i}, {s(c['nome'])}, {s(c.get('documento'))}, {s(c.get('responsavel'))}, "
            f"{s(c.get('telefone'))}, {s(c.get('email'))}, {s(c['endereco'])}, "
            f"{s(c['cidade'])}, {s(c['criadoEm'])})"
        )
    partes += [",\n".join(linhas) + ";", ""]

    # --- projetos ---------------------------------------------------------
    ids_projeto = {}
    partes.append("INSERT INTO projeto (id, nome, cliente_id, criado_em) VALUES")
    linhas = []
    for i, p in enumerate(db.get("projetos", []), start=1):
        ids_projeto[p["id"]] = i
        linhas.append(
            f"  ({i}, {s(p['nome'])}, {ids_cliente[p['clienteId']]}, {s(p['criadoEm'])})"
        )
    partes += [",\n".join(linhas) + ";", ""]

    # --- entregas ---------------------------------------------------------
    entregas = db.get("entregas", [])
    if entregas:
        partes.append("INSERT INTO entrega (id, motorista_id, cliente_id, endereco, cidade, "
                      "janela_inicio, janela_fim, distancia_km, prioridade, observacoes_operador, "
                      "data, ordem, status, observacoes, concluida_em, criado_em) VALUES")
        linhas = []
        for i, e in enumerate(entregas, start=1):
            linhas.append(
                f"  ({i}, {ids_usuario[e['motoristaId']]}, {ids_cliente[e['clienteId']]}, "
                f"{s(e['endereco'])}, {s(e['cidade'])}, {s(e['janelaInicio'])}, {s(e['janelaFim'])}, "
                f"{n(e.get('distanciaKm'))}, {s((e.get('prioridade') or 'normal').upper())}, "
                f"{s(e.get('observacoesOperador'))}, {s(e['data'])}, {n(e.get('ordem'), '1')}, "
                f"{s((e.get('status') or 'pendente').upper())}, {s(e.get('observacoes'))}, "
                f"{datahora(e.get('concluidaEm'))}, {datahora(e.get('criadoEm'))})"
            )
        partes += [",\n".join(linhas) + ";", ""]
    else:
        partes += ["-- Nenhuma entrega no db.json: a tabela entrega começa vazia.", ""]

    # --- analises ---------------------------------------------------------
    analises = db.get("analises", [])
    if analises:
        partes.append("INSERT INTO analise (id, titulo, projeto_id, criado_por_id, status, "
                      "criado_em, serie_temporal, fontes, resultado) VALUES")
        linhas = []
        for i, a in enumerate(analises, start=1):
            projeto = ids_projeto.get(a.get("projetoId"))
            linhas.append(
                f"  ({i}, {s(a['titulo'])}, {projeto if projeto else 'NULL'}, "
                f"{ids_usuario[a['criadoPorId']]}, {s(a['status'])}, {s(a['criadoEm'])}, "
                f"{j(a.get('serieTemporal', []))}, {j(a.get('fontes', []))}, {j(a.get('resultado'))})"
            )
        partes += [",\n".join(linhas) + ";", ""]

    DESTINO.write_text("\n".join(partes) + "\n", encoding="utf-8")

    print(f"gerado: {DESTINO.relative_to(RAIZ)}")
    print(f"  {len(ids_usuario)} usuário(s), {len(ids_cliente)} cliente(s), "
          f"{len(ids_projeto)} projeto(s), {len(entregas)} entrega(s), {len(analises)} análise(s)")


if __name__ == "__main__":
    main()
