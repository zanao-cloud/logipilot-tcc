-- Esquema do LogiPilot.
-- As tabelas substituem as coleções que antes viviam no db.json do json-server:
-- o que lá era um campo repetido (o nome do cliente dentro do projeto, por exemplo)
-- aqui vira chave estrangeira.

CREATE TABLE usuario (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    nome      VARCHAR(120) NOT NULL,
    email     VARCHAR(160) NOT NULL,
    senha     VARCHAR(100) NOT NULL COMMENT 'hash BCrypt, nunca a senha digitada',
    papel     VARCHAR(20)  NOT NULL,
    telefone  VARCHAR(30),
    placa     VARCHAR(10)  COMMENT 'preenchido apenas para motoristas',
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_papel CHECK (papel IN ('GESTOR', 'OPERADOR', 'MOTORISTA'))
) ENGINE = InnoDB;

CREATE TABLE cliente (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(120) NOT NULL,
    documento   VARCHAR(30),
    responsavel VARCHAR(120),
    telefone    VARCHAR(30),
    email       VARCHAR(160),
    endereco    VARCHAR(200) NOT NULL,
    cidade      VARCHAR(120) NOT NULL,
    criado_em   DATE         NOT NULL,
    CONSTRAINT pk_cliente PRIMARY KEY (id),
    CONSTRAINT uk_cliente_nome UNIQUE (nome)
) ENGINE = InnoDB;

CREATE TABLE projeto (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    nome       VARCHAR(120) NOT NULL,
    cliente_id BIGINT       NOT NULL,
    criado_em  DATE         NOT NULL,
    CONSTRAINT pk_projeto PRIMARY KEY (id),
    CONSTRAINT fk_projeto_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
) ENGINE = InnoDB;

CREATE TABLE entrega (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    motorista_id         BIGINT        NOT NULL,
    cliente_id           BIGINT        NOT NULL,
    endereco             VARCHAR(200)  NOT NULL,
    cidade               VARCHAR(120)  NOT NULL,
    janela_inicio        TIME          NOT NULL,
    janela_fim           TIME          NOT NULL,
    distancia_km         DECIMAL(7, 2) NOT NULL DEFAULT 0,
    prioridade           VARCHAR(10)   NOT NULL DEFAULT 'NORMAL',
    observacoes_operador VARCHAR(500),
    data                 DATE          NOT NULL,
    ordem                INT           NOT NULL DEFAULT 1 COMMENT 'sequencia da rota; a otimizacao por IA reescreve este campo',
    status               VARCHAR(12)   NOT NULL DEFAULT 'PENDENTE',
    observacoes          VARCHAR(500)  COMMENT 'escritas pelo motorista ao registrar a parada',
    concluida_em         DATETIME(6),
    criado_em            DATETIME(6)   NOT NULL,
    CONSTRAINT pk_entrega PRIMARY KEY (id),
    CONSTRAINT fk_entrega_motorista FOREIGN KEY (motorista_id) REFERENCES usuario (id),
    CONSTRAINT fk_entrega_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
    CONSTRAINT ck_entrega_status CHECK (status IN ('PENDENTE', 'ENTREGUE', 'AUSENTE')),
    CONSTRAINT ck_entrega_prioridade CHECK (prioridade IN ('NORMAL', 'ALTA')),
    CONSTRAINT ck_entrega_janela CHECK (janela_fim > janela_inicio)
) ENGINE = InnoDB;

-- A rota de um motorista é sempre consultada por motorista + dia.
CREATE INDEX ix_entrega_motorista_data ON entrega (motorista_id, data);

CREATE TABLE analise (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    titulo         VARCHAR(160) NOT NULL,
    projeto_id     BIGINT,
    criado_por_id  BIGINT       NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    criado_em      DATE         NOT NULL,
    -- O retorno da IA não tem forma fixa (indicadores, gargalos, plano de ação...),
    -- então fica em colunas JSON em vez de virar dezenas de tabelas.
    serie_temporal JSON,
    fontes         JSON,
    resultado      JSON,
    CONSTRAINT pk_analise PRIMARY KEY (id),
    CONSTRAINT fk_analise_projeto FOREIGN KEY (projeto_id) REFERENCES projeto (id) ON DELETE SET NULL,
    CONSTRAINT fk_analise_criado_por FOREIGN KEY (criado_por_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

CREATE INDEX ix_analise_criado_por ON analise (criado_por_id);
