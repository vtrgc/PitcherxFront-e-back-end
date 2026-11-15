-- O título era único na tabela inteira: dois projetos não podiam ter, por exemplo, um termo
-- "Confidencialidade" (o INSERT do segundo projeto falhava com erro 500). A regra do sistema
-- (TermoVinculoService) é título único POR PROJETO.
ALTER TABLE termo_vinculo DROP CONSTRAINT IF EXISTS termo_vinculo_titulo_termo_vinculo_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_termo_vinculo_projeto_titulo ON termo_vinculo (projeto_id, titulo_termo_vinculo);
