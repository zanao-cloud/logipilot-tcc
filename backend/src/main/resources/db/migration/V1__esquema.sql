-- Esquema do LogiPilot no Microsoft SQL Server.
--
-- As tabelas substituem as coleções que antes viviam no db.json do json-server:
-- o que lá era um campo repetido (o nome do cliente dentro do projeto, por
-- exemplo) aqui vira chave estrangeira.
--
-- O histórico de migrações do MySQL foi consolidado neste script ao trocar de
-- banco: um esquema versionado só faz sentido para o motor em que ele roda, e
-- recriar passo a passo uma evolução que nunca aconteceu no SQL Server seria
-- história inventada.

CREATE TABLE usuario (
    id       BIGINT IDENTITY(1,1) NOT NULL,
    nome     NVARCHAR(120) NOT NULL,
    email    NVARCHAR(160) NOT NULL,
    -- hash BCrypt, nunca a senha digitada
    senha    VARCHAR(100)  NOT NULL,
    papel    VARCHAR(20)   NOT NULL,
    telefone VARCHAR(30)   NULL,
    -- preenchida apenas para motoristas
    placa    VARCHAR(10)   NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_papel CHECK (papel IN ('GESTOR', 'OPERADOR', 'MOTORISTA')),
    -- Placa nos dois padrões que circulam: antigo AAA1234 e Mercosul AAA1A23.
    -- O SQL Server não tem expressão regular, então a checagem usa as classes
    -- de caracteres do LIKE; a collation binária obriga as letras a serem
    -- maiúsculas, já que a collation padrão do banco ignora caixa.
    CONSTRAINT ck_usuario_placa CHECK (
        placa IS NULL OR
        placa COLLATE Latin1_General_BIN2 LIKE '[A-Z][A-Z][A-Z][0-9][0-9A-Z][0-9][0-9]'
    ),
    -- Telefone brasileiro só com dígitos: DDD + 8 (fixo) ou DDD + 9 (celular,
    -- começando com 9).
    CONSTRAINT ck_usuario_telefone CHECK (
        telefone IS NULL OR
        telefone LIKE '[1-9][1-9][2-8][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' OR
        telefone LIKE '[1-9][1-9]9[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    )
);

CREATE TABLE cliente (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    nome        NVARCHAR(120) NOT NULL,
    documento   NVARCHAR(30)  NULL,
    responsavel NVARCHAR(120) NULL,
    telefone    VARCHAR(30)   NULL,
    email       NVARCHAR(160) NULL,
    -- serve de sugestão quando o operador designa uma entrega
    endereco    NVARCHAR(200) NOT NULL,
    cidade      NVARCHAR(120) NOT NULL,
    criado_em   DATE          NOT NULL,
    CONSTRAINT pk_cliente PRIMARY KEY (id),
    CONSTRAINT uk_cliente_nome UNIQUE (nome),
    CONSTRAINT ck_cliente_telefone CHECK (
        telefone IS NULL OR
        telefone LIKE '[1-9][1-9][2-8][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' OR
        telefone LIKE '[1-9][1-9]9[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    )
);

CREATE TABLE projeto (
    id         BIGINT IDENTITY(1,1) NOT NULL,
    nome       NVARCHAR(120) NOT NULL,
    -- o cliente deixou de ser texto digitado e passou a ser uma referência
    cliente_id BIGINT        NOT NULL,
    criado_em  DATE          NOT NULL,
    CONSTRAINT pk_projeto PRIMARY KEY (id),
    CONSTRAINT fk_projeto_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
);

CREATE TABLE entrega (
    id                   BIGINT IDENTITY(1,1) NOT NULL,
    motorista_id         BIGINT        NOT NULL,
    cliente_id           BIGINT        NOT NULL,
    -- identificação da etiqueta: é por ela que o motorista acha a caixa na van
    codigo               NVARCHAR(40)  NOT NULL,
    -- quantas caixas vão para esta parada
    volumes              INT           NOT NULL CONSTRAINT df_entrega_volumes DEFAULT 1,
    -- marcada na conferência de carga, antes de o motorista sair
    conferida_em         DATETIMEOFFSET(6) NULL,
    endereco             NVARCHAR(200) NOT NULL,
    cidade               NVARCHAR(120) NOT NULL,
    janela_inicio        TIME(0)       NOT NULL,
    janela_fim           TIME(0)       NOT NULL,
    distancia_km         DECIMAL(7, 2) NOT NULL CONSTRAINT df_entrega_distancia DEFAULT 0,
    prioridade           VARCHAR(10)   NOT NULL CONSTRAINT df_entrega_prioridade DEFAULT 'NORMAL',
    observacoes_operador NVARCHAR(500) NULL,
    data                 DATE          NOT NULL,
    -- sequência da rota; a otimização por IA reescreve este campo
    ordem                INT           NOT NULL CONSTRAINT df_entrega_ordem DEFAULT 1,
    status               VARCHAR(12)   NOT NULL CONSTRAINT df_entrega_status DEFAULT 'PENDENTE',
    -- escritas pelo motorista ao registrar a parada
    observacoes          NVARCHAR(500) NULL,
    recebido_por         NVARCHAR(120) NULL,
    comprovante_arquivo  NVARCHAR(255) NULL,
    -- quando esta parada é uma nova tentativa, aponta para a que deu ausente
    reagendada_de_id     BIGINT        NULL,
    -- DATETIMEOFFSET guarda o fuso junto, que é o que o Instant do Java
    -- representa; com DATETIME2 o horário viajaria conforme o fuso da máquina.
    concluida_em         DATETIMEOFFSET(6) NULL,
    criado_em            DATETIMEOFFSET(6) NOT NULL,
    CONSTRAINT pk_entrega PRIMARY KEY (id),
    CONSTRAINT fk_entrega_motorista FOREIGN KEY (motorista_id) REFERENCES usuario (id),
    CONSTRAINT fk_entrega_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
    -- O SQL Server não aceita ação em cascata numa chave que aponta para a
    -- própria tabela, então apagar a tentativa original é bloqueado — o que
    -- preserva o histórico da visita anterior.
    CONSTRAINT fk_entrega_reagendada_de FOREIGN KEY (reagendada_de_id) REFERENCES entrega (id),
    CONSTRAINT ck_entrega_status CHECK (status IN ('PENDENTE', 'ENTREGUE', 'AUSENTE')),
    CONSTRAINT ck_entrega_prioridade CHECK (prioridade IN ('NORMAL', 'ALTA')),
    CONSTRAINT ck_entrega_janela CHECK (janela_fim > janela_inicio),
    CONSTRAINT ck_entrega_volumes CHECK (volumes >= 1)
);

-- A rota de um motorista é sempre consultada por motorista + dia.
CREATE INDEX ix_entrega_motorista_data ON entrega (motorista_id, data);

-- Dois pacotes com o mesmo código na rota do mesmo dia deixariam o motorista
-- sem saber qual é qual — que é justamente o problema que o campo resolve.
CREATE UNIQUE INDEX uk_entrega_codigo_na_rota ON entrega (motorista_id, data, codigo);

-- Uma tentativa anterior só pode gerar uma nova entrega. O índice é filtrado
-- porque no SQL Server, ao contrário do MySQL, um índice único comum trata
-- vários NULL como repetidos.
CREATE UNIQUE INDEX uk_entrega_reagendada_de ON entrega (reagendada_de_id)
    WHERE reagendada_de_id IS NOT NULL;

CREATE TABLE analise (
    id             BIGINT IDENTITY(1,1) NOT NULL,
    titulo         NVARCHAR(160) NOT NULL,
    projeto_id     BIGINT        NULL,
    criado_por_id  BIGINT        NOT NULL,
    status         VARCHAR(20)   NOT NULL,
    criado_em      DATE          NOT NULL,
    -- O retorno da IA não tem forma fixa (indicadores, gargalos, plano de
    -- ação...). O SQL Server não tem tipo JSON: o conteúdo fica em NVARCHAR(MAX)
    -- e o ISJSON garante que só entra JSON válido, consultável por JSON_VALUE.
    serie_temporal NVARCHAR(MAX) NULL,
    fontes         NVARCHAR(MAX) NULL,
    resultado      NVARCHAR(MAX) NULL,
    CONSTRAINT pk_analise PRIMARY KEY (id),
    CONSTRAINT fk_analise_projeto FOREIGN KEY (projeto_id) REFERENCES projeto (id),
    CONSTRAINT fk_analise_criado_por FOREIGN KEY (criado_por_id) REFERENCES usuario (id),
    CONSTRAINT ck_analise_serie CHECK (serie_temporal IS NULL OR ISJSON(serie_temporal) = 1),
    CONSTRAINT ck_analise_fontes CHECK (fontes IS NULL OR ISJSON(fontes) = 1),
    CONSTRAINT ck_analise_resultado CHECK (resultado IS NULL OR ISJSON(resultado) = 1)
);

CREATE INDEX ix_analise_criado_por ON analise (criado_por_id);
