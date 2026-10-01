CREATE TABLE contrato(
    id_contrato BIGSERIAL PRIMARY KEY,
    titulo_contrato VARCHAR(255) NOT NULL,
    descricao_contrato TEXT NOT NULL,
    data_inicio_contrato TIMESTAMP NOT NULL,
    data_fim_contrato TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL,
    id_projeto BIGINT NOT NULL,
    FOREIGN KEY (id_projeto) REFERENCES projeto(id_projeto)
);
