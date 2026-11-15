ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS url_comprovante_identidade VARCHAR(500),
    ADD COLUMN IF NOT EXISTS status_analise_identidade VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status_analise_identidade IN ('PENDENTE','APROVADA','REPROVADA')),
    ADD COLUMN IF NOT EXISTS tentativas_identidade INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nivel_conta_id BIGINT,
    ADD CONSTRAINT fk_usuario_nivel_conta FOREIGN KEY (nivel_conta_id) REFERENCES nivel_conta(id_nivel_conta);

CREATE INDEX IF NOT EXISTS idx_usuario_status_identidade ON usuario(status_analise_identidade);
CREATE INDEX IF NOT EXISTS idx_usuario_nivel_conta ON usuario(nivel_conta_id);
