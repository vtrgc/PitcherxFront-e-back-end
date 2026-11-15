CREATE TABLE projeto_interacao (
    id_projeto_interacao BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    tipo_interacao VARCHAR(20) NOT NULL CHECK (tipo_interacao IN ('VISUALIZACAO', 'SEGUIR')),
    data_interacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projeto_interacao_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id_projeto),
    CONSTRAINT fk_projeto_interacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario),
    CONSTRAINT uk_projeto_usuario_tipo UNIQUE (projeto_id, usuario_id, tipo_interacao)
);

CREATE INDEX IF NOT EXISTS idx_projeto_interacao_projeto_tipo ON projeto_interacao(projeto_id, tipo_interacao);
CREATE INDEX IF NOT EXISTS idx_projeto_interacao_usuario_tipo ON projeto_interacao(usuario_id, tipo_interacao);
CREATE INDEX IF NOT EXISTS idx_projeto_interacao_data ON projeto_interacao(data_interacao);
