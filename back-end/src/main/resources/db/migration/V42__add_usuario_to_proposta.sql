ALTER TABLE proposta
    ADD COLUMN IF NOT EXISTS usuario_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_proposta_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario);

CREATE INDEX IF NOT EXISTS idx_proposta_usuario ON proposta(usuario_id);
