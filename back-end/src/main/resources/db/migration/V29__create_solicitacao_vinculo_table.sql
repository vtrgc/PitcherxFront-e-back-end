CREATE TABLE solicitacao_vinculo (
    id_solicitacao_vinculo BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    solicitante_id BIGINT NOT NULL,
    tipo_vinculo_desejado_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projeto(id_projeto) ON DELETE CASCADE,
    FOREIGN KEY (solicitante_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (tipo_vinculo_desejado_id) REFERENCES tipo_vinculo(id_tipo_vinculo),
    CONSTRAINT uk_solicitacao_unica UNIQUE (projeto_id, solicitante_id, tipo_vinculo_desejado_id)
);

CREATE INDEX idx_solicitacao_projeto_status ON solicitacao_vinculo(projeto_id, status);
CREATE INDEX idx_solicitacao_solicitante ON solicitacao_vinculo(solicitante_id);