CREATE TABLE usuario_role (
                              id_usuario  BIGINT NOT NULL,
                              id_role     BIGINT NOT NULL,
                              PRIMARY KEY (id_usuario, id_role),
                              CONSTRAINT fk_usuario_role_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                              CONSTRAINT fk_usuario_role_role    FOREIGN KEY (id_role)    REFERENCES role(id_role)       ON DELETE CASCADE
);
