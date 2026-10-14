-- Duas mudanças no cadastro:
--
-- 1. O pacote passa a existir antes da entrega. Ele dá entrada no estoque com
--    código, destinatário e volumes, e fica lá até o operador designar para
--    onde e com quem vai. Antes disso, o código do pacote era digitado à mão
--    na hora de designar e não havia como saber o que estava parado no galpão.
--
-- 2. O endereço do cliente deixa de ser um texto solto e passa a ter CEP,
--    logradouro, número, bairro e UF, para localizar a empresa sem ambiguidade.

-- ─────────────────────────────── endereço ───────────────────────────────

ALTER TABLE cliente
    ADD cep         VARCHAR(8)    NULL,
        logradouro  NVARCHAR(160) NULL,
        numero      NVARCHAR(20)  NULL,
        complemento NVARCHAR(80)  NULL,
        bairro      NVARCHAR(120) NULL,
        uf          VARCHAR(2)    NULL;
GO

-- O CEP é guardado só com dígitos; a máscara 00000-000 é feita na tela.
ALTER TABLE cliente
    ADD CONSTRAINT ck_cliente_cep CHECK (
        cep IS NULL OR cep LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    );
GO

-- Os clientes que já existiam tinham só o texto do endereço. Ele vira o
-- logradouro; CEP, número, bairro e UF ficam em branco até alguém editar o
-- cadastro — preencher com palpite seria inventar dado de localização.
UPDATE cliente SET logradouro = endereco WHERE logradouro IS NULL;
GO

-- ──────────────────────────────── pacote ────────────────────────────────

CREATE TABLE pacote (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    -- o que está escrito na etiqueta; é por ele que o motorista acha a caixa
    codigo      NVARCHAR(40)  NOT NULL,
    cliente_id  BIGINT        NOT NULL,
    volumes     INT           NOT NULL CONSTRAINT df_pacote_volumes DEFAULT 1,
    descricao   NVARCHAR(200) NULL,
    peso_kg     DECIMAL(7, 2) NULL,
    observacoes NVARCHAR(500) NULL,
    recebido_em DATETIMEOFFSET(6) NOT NULL,
    status      VARCHAR(12)   NOT NULL CONSTRAINT df_pacote_status DEFAULT 'EM_ESTOQUE',
    CONSTRAINT pk_pacote PRIMARY KEY (id),
    CONSTRAINT uk_pacote_codigo UNIQUE (codigo),
    CONSTRAINT fk_pacote_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
    CONSTRAINT ck_pacote_status CHECK (status IN ('EM_ESTOQUE', 'DESIGNADO', 'ENTREGUE')),
    CONSTRAINT ck_pacote_volumes CHECK (volumes >= 1),
    CONSTRAINT ck_pacote_peso CHECK (peso_kg IS NULL OR peso_kg > 0)
);
GO

-- A tela de estoque lista o que está parado, então filtra por status.
CREATE INDEX ix_pacote_status ON pacote (status);
GO

-- ─────────────────── liga as entregas que já existiam ───────────────────

-- Cada código vira um pacote. Uma entrega reagendada repete o código da
-- original, então as duas passam a apontar para o mesmo pacote — que é
-- exatamente o que aconteceu na prática: a segunda visita é do mesmo volume.
INSERT INTO pacote (codigo, cliente_id, volumes, recebido_em, status)
SELECT
    e.codigo,
    MIN(e.cliente_id),
    MAX(e.volumes),
    MIN(e.criado_em),
    CASE WHEN MAX(CASE WHEN e.status = 'ENTREGUE' THEN 1 ELSE 0 END) = 1
         THEN 'ENTREGUE' ELSE 'DESIGNADO' END
FROM entrega e
GROUP BY e.codigo;
GO

ALTER TABLE entrega ADD pacote_id BIGINT NULL;
GO

UPDATE e SET e.pacote_id = p.id
FROM entrega e
JOIN pacote p ON p.codigo = e.codigo;
GO

ALTER TABLE entrega ALTER COLUMN pacote_id BIGINT NOT NULL;
GO

ALTER TABLE entrega
    ADD CONSTRAINT fk_entrega_pacote FOREIGN KEY (pacote_id) REFERENCES pacote (id);
GO

CREATE INDEX ix_entrega_pacote ON entrega (pacote_id);
GO
