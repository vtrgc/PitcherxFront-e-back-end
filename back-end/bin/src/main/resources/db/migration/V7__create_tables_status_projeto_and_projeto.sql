CREATE TABLE projeto(
	id_projeto BIGSERIAL PRIMARY KEY,
	nome_projeto VARCHAR(255),
	descricao_projeto TEXT NOT NULL,
	data_inicio_projeto DATE NOT NULL,
	data_fim_projeto DATE NOT NULL,
	is_active_projeto BOOLEAN NOT NULL DEFAULT TRUE,
	url_imagem_projeto VARCHAR(155),
	tipo_projeto_id BIGINT NOT NULL,
	FOREIGN KEY (tipo_projeto_id) REFERENCES tipo_projeto(id_tipo_projeto)
	ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE status_projeto(
	id_status_projeto BIGSERIAL PRIMARY KEY,
	status_pj VARCHAR(30) NOT NULL,
	data_status TIMESTAMP NOT NULL,
	descricao_status TEXT,
	projeto_id BIGINT NOT NULL,
	FOREIGN KEY (projeto_id) REFERENCES projeto(id_projeto)
	ON DELETE CASCADE ON UPDATE CASCADE
);