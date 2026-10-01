CREATE TABLE projeto_usuario (
     id_projeto_usuario BIGSERIAL PRIMARY KEY,
     projeto_id BIGINT NOT NULL,
     usuario_id BIGINT NOT NULL,
     tipo_vinculo_id BIGINT NOT NULL,
     data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (projeto_id) REFERENCES projeto(id_projeto),
     FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario),
     FOREIGN KEY (tipo_vinculo_id) REFERENCES tipo_vinculo(id_tipo_vinculo),

    -- Evita duplicação de vínculo (mesmo usuário com o mesmo tipo no mesmo projeto)
     CONSTRAINT uk_pu_unico UNIQUE (projeto_id, usuario_id, tipo_vinculo_id)
);