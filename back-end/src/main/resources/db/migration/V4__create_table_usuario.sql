CREATE TABLE usuario(
    id_usuario BIGSERIAL PRIMARY KEY,
    nome_usuario VARCHAR(255) NOT NULL,
    email_usuario VARCHAR(255) NOT NULL UNIQUE,
    senha_usuario VARCHAR(255) NOT NULL,
    telefone_usuario VARCHAR(13),
    url_imagem_usuario VARCHAR(255),
    is_active_usuario BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao_usuario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao_usuario TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);