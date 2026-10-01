CREATE TABLE termo (
    id BIGSERIAL PRIMARY KEY,
    titulo_termo VARCHAR(255) NOT NULL,
    descricao_termo VARCHAR(255) NOT NULL,
    id_contrato BIGINT,
    FOREIGN KEY (id_contrato) REFERENCES contrato(id_contrato)
);