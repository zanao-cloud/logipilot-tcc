-- Placa e telefone passam a seguir o formato brasileiro, para o cadastro não
-- aceitar valor inventado.
--
-- Placa, nos dois padrões que circulam hoje:
--   antigo    AAA1234  (3 letras + 4 dígitos)
--   Mercosul  AAA1A23  (3 letras, dígito, letra, 2 dígitos)
--
-- Telefone é guardado só com dígitos (DDD + número); a formatação com
-- parênteses e traço é feita na tela.
--   fixo    10 dígitos — DDD + 8, começando de 2 a 8
--   celular 11 dígitos — DDD + 9 dígitos, começando com 9

-- Normaliza o que já existe: tira máscara do telefone e maiúsculas na placa.
UPDATE usuario SET telefone = REGEXP_REPLACE(telefone, '[^0-9]', '') WHERE telefone IS NOT NULL;
UPDATE cliente SET telefone = REGEXP_REPLACE(telefone, '[^0-9]', '') WHERE telefone IS NOT NULL;
UPDATE usuario SET placa = UPPER(REGEXP_REPLACE(placa, '[^A-Za-z0-9]', '')) WHERE placa IS NOT NULL;

-- O que não bate com o formato era valor de teste e não tem como ser corrigido
-- automaticamente: fica em branco para ser preenchido de novo no cadastro.
UPDATE usuario SET telefone = NULL
 WHERE telefone IS NOT NULL
   AND NOT REGEXP_LIKE(telefone, '^[1-9][1-9](9[0-9]{8}|[2-8][0-9]{7})$');

UPDATE cliente SET telefone = NULL
 WHERE telefone IS NOT NULL
   AND NOT REGEXP_LIKE(telefone, '^[1-9][1-9](9[0-9]{8}|[2-8][0-9]{7})$');

UPDATE usuario SET placa = NULL
 WHERE placa IS NOT NULL
   AND NOT REGEXP_LIKE(placa, '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', 'c');

ALTER TABLE usuario
    ADD CONSTRAINT ck_usuario_placa
        CHECK (placa IS NULL OR REGEXP_LIKE(placa, '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', 'c')),
    ADD CONSTRAINT ck_usuario_telefone
        CHECK (telefone IS NULL OR REGEXP_LIKE(telefone, '^[1-9][1-9](9[0-9]{8}|[2-8][0-9]{7})$'));

ALTER TABLE cliente
    ADD CONSTRAINT ck_cliente_telefone
        CHECK (telefone IS NULL OR REGEXP_LIKE(telefone, '^[1-9][1-9](9[0-9]{8}|[2-8][0-9]{7})$'));
