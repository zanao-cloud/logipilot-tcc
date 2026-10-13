-- Identificação do pacote na entrega.
--
-- Sem isto o motorista recebe o endereço mas não sabe qual caixa da van é
-- daquela parada. O "codigo" é o que está escrito na etiqueta do volume, e
-- "volumes" diz quantas caixas saem para o mesmo endereço.

ALTER TABLE entrega
    ADD COLUMN codigo  VARCHAR(40) NULL COMMENT 'identificação da etiqueta do pacote/caixa' AFTER cliente_id,
    ADD COLUMN volumes INT NOT NULL DEFAULT 1 COMMENT 'quantas caixas vão para esta parada' AFTER codigo;

-- As entregas que já existiam foram cadastradas antes deste campo existir;
-- recebem um código derivado do próprio id para não ficarem sem identificação.
UPDATE entrega SET codigo = CONCAT('CX-', LPAD(id, 4, '0')) WHERE codigo IS NULL;

ALTER TABLE entrega
    MODIFY COLUMN codigo VARCHAR(40) NOT NULL COMMENT 'identificação da etiqueta do pacote/caixa';

ALTER TABLE entrega
    ADD CONSTRAINT ck_entrega_volumes CHECK (volumes >= 1);

-- Dois pacotes com o mesmo código na rota do mesmo dia deixariam o motorista
-- sem saber qual é qual — que é justamente o problema que o campo resolve.
CREATE UNIQUE INDEX uk_entrega_codigo_na_rota ON entrega (motorista_id, data, codigo);
