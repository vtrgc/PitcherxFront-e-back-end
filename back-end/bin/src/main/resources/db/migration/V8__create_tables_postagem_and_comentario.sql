CREATE TABLE postagem(
	id_postagem BIGSERIAL PRIMARY KEY,
	titulo_postagem VARCHAR(80) NOT NULL,
	texto_postagem TEXT NOT NULL,
	data_postagem DATE NOT NULL,
	like_postagem BIGINT,
	dislike_postagem BIGINT,
	url_imagem_postagem VARCHAR(150),
	usuario_id BIGINT NOT NULL,
	FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) 
	ON DELETE CASCADE ON UPDATE CASCADE	
);

CREATE TABLE comentario(
	id_comentario BIGSERIAL PRIMARY KEY,
	texto_comentario TEXT NOT NULL,
	like_comentario BIGINT,
	dislike_comentario BIGINT,
	postagem_id BIGINT NOT NULL,
	FOREIGN KEY (postagem_id) REFERENCES postagem(id_postagem)
	ON DELETE CASCADE ON UPDATE CASCADE,
	usuario_id BIGINT NOT NULL,
	FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) 
	ON DELETE CASCADE ON UPDATE CASCADE	
);