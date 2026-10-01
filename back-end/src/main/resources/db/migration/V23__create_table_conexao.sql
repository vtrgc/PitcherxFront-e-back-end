CREATE TABLE conexao (
    id_conexao BIGSERIAL PRIMARY KEY,
    seguidor_id BIGINT NOT NULL REFERENCES usuario(id_usuario),
    seguido_id BIGINT NOT NULL REFERENCES usuario(id_usuario),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP,
    UNIQUE (seguidor_id, seguido_id)
);

CREATE TABLE notificacao (
    id_notificacao BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id_usuario),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    referencia_id BIGINT,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);