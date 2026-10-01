CREATE TABLE curtida (
    id_curtida BIGSERIAL PRIMARY KEY,
    curtida BOOLEAN NOT NULL DEFAULT TRUE,
    usuario_id BIGINT NOT NULL,
    tipo_conteudo_id BIGINT NOT NULL,
    conteudo_id BIGINT NOT NULL,
    data_curtida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario),
    FOREIGN KEY (tipo_conteudo_id) REFERENCES tipo_conteudo(id_tipo_conteudo)
);