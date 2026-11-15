ALTER TABLE termo_vinculo
    ADD COLUMN projeto_id BIGINT,
    ADD COLUMN obrigatorio BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE termo_vinculo
    ADD CONSTRAINT fk_termo_vinculo_projeto
    FOREIGN KEY (projeto_id) REFERENCES projeto(id_projeto)
    ON DELETE CASCADE;