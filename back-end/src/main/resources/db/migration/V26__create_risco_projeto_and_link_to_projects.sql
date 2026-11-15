CREATE TABLE risco_projeto (
    id_risco_projeto BIGSERIAL PRIMARY KEY,
    nome_risco VARCHAR(255) NOT NULL UNIQUE,
    descricao_risco TEXT
);

CREATE TABLE projeto_risco_projeto (
    projeto_id BIGINT NOT NULL,
    risco_projeto_id BIGINT NOT NULL,
    CONSTRAINT pk_projeto_risco_projeto PRIMARY KEY (projeto_id, risco_projeto_id),
    CONSTRAINT fk_prp_projeto FOREIGN KEY (projeto_id)
        REFERENCES projeto (id_projeto) ON DELETE CASCADE,
    CONSTRAINT fk_prp_risco FOREIGN KEY (risco_projeto_id)
        REFERENCES risco_projeto (id_risco_projeto) ON DELETE RESTRICT
);

INSERT INTO risco_projeto (nome_risco)
SELECT DISTINCT BTRIM(risco_projeto)
FROM projeto
WHERE risco_projeto IS NOT NULL
  AND BTRIM(risco_projeto) <> ''
ON CONFLICT (nome_risco) DO NOTHING;

INSERT INTO projeto_risco_projeto (projeto_id, risco_projeto_id)
SELECT p.id_projeto, r.id_risco_projeto
FROM projeto p
JOIN risco_projeto r ON r.nome_risco = BTRIM(p.risco_projeto)
WHERE p.risco_projeto IS NOT NULL
  AND BTRIM(p.risco_projeto) <> '';

ALTER TABLE projeto DROP COLUMN risco_projeto;