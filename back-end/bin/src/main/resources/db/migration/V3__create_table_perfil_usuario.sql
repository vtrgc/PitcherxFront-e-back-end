CREATE TABLE perfil_usuario(
	id_perfil_usuario BIGSERIAL PRIMARY KEY,
	linkedin VARCHAR(80) NOT NULL,
	especialidade_id BIGINT NOT NULL,
	FOREIGN KEY (especialidade_id) REFERENCES especialidade(id_especialidade) ON UPDATE CASCADE ON DELETE CASCADE
);