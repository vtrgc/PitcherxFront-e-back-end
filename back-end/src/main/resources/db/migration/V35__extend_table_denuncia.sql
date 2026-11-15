ALTER TABLE denuncia
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) NOT NULL DEFAULT 'OUTROS',
    ADD COLUMN IF NOT EXISTS descricao VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS denunciante_id BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'BAIXA' CHECK (prioridade IN ('BAIXA','MEDIA','ALTA','CRITICA')),
    ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP,
    ADD COLUMN IF NOT EXISTS admin_id BIGINT,
    ADD COLUMN IF NOT EXISTS acao_tomada VARCHAR(100),
    ADD COLUMN IF NOT EXISTS apelacao_solicitada BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS apelacao_justificativa VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS apelacao_decisao VARCHAR(100),
    ADD COLUMN IF NOT EXISTS apelacao_data TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_denuncia_denunciante ON denuncia(denunciante_id);
CREATE INDEX IF NOT EXISTS idx_denuncia_prioridade ON denuncia(prioridade);
CREATE INDEX IF NOT EXISTS idx_denuncia_categoria ON denuncia(categoria);
