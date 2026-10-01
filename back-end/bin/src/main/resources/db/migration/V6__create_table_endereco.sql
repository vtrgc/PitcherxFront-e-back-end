CREATE TABLE endereco(
	id_endereco BIGSERIAL PRIMARY KEY,
	cep VARCHAR(8) NOT NULL,
	rua_endereco VARCHAR(155) NOT NULL,
	bairro_endereco VARCHAR(155) NOT NULL,
	numero_endereco BIGINT NOT NULL,
	usuario_id BIGINT NOT NULL,
	FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);