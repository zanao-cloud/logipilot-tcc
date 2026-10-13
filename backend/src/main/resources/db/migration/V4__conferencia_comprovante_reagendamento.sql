-- Três melhorias no ciclo da entrega:
--
-- 1. conferência de carga: o motorista marca, antes de sair, que pegou a caixa.
--    O erro aparece na garagem e não na porta do cliente.
-- 2. comprovante: quem recebeu e a foto do canhoto/fachada, para sustentar a
--    entrega quando o cliente alega que não recebeu.
-- 3. reagendamento: a parada em que não havia ninguém no local deixa de morrer
--    como ausente e volta para a fila do operador.

ALTER TABLE entrega
    ADD COLUMN conferida_em DATETIME(6) NULL
        COMMENT 'quando o motorista confirmou que carregou o pacote' AFTER volumes;

ALTER TABLE entrega
    ADD COLUMN recebido_por VARCHAR(120) NULL
        COMMENT 'nome de quem recebeu a mercadoria' AFTER observacoes,
    ADD COLUMN comprovante_arquivo VARCHAR(255) NULL
        COMMENT 'nome do arquivo da foto do comprovante' AFTER recebido_por;

-- A entrega reagendada é uma nova parada que aponta para a que não foi entregue;
-- assim o histórico da tentativa anterior não se perde.
ALTER TABLE entrega
    ADD COLUMN reagendada_de_id BIGINT NULL
        COMMENT 'entrega ausente que originou esta nova tentativa' AFTER comprovante_arquivo,
    ADD CONSTRAINT fk_entrega_reagendada_de
        FOREIGN KEY (reagendada_de_id) REFERENCES entrega (id) ON DELETE SET NULL;

-- Uma tentativa anterior só pode gerar uma nova entrega: sem isto, dois cliques
-- no botão de reagendar criariam duas paradas para o mesmo pacote.
CREATE UNIQUE INDEX uk_entrega_reagendada_de ON entrega (reagendada_de_id);
