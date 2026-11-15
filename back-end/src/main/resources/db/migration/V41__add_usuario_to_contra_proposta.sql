ALTER TABLE contra_proposta
    ADD COLUMN IF NOT EXISTS usuario_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_contra_proposta_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario);

CREATE INDEX IF NOT EXISTS idx_contra_proposta_usuario ON contra_proposta(usuario_id);
