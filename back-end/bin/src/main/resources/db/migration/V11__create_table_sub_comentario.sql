CREATE TABLE sub_comentario(
	id_sub_comentario BIGSERIAL PRIMARY KEY,
	texto_sub_comentario TEXT NOT NULL,
	like_sub_comentario BIGINT,
	dislike_sub_comentario BIGINT,
	comentario_id BIGINT NOT NULL,
	FOREIGN KEY (comentario_id) REFERENCES comentario(id_comentario) ON UPDATE CASCADE ON DELETE CASCADE,
	usuario_id BIGINT NOT NULL,
	FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario) 
	ON DELETE CASCADE ON UPDATE CASCADE	
);