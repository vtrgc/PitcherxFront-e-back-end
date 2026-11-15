ALTER TABLE projeto_usuario
    ADD COLUMN aceitou_termos BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN data_aceite TIMESTAMP;