CREATE UNIQUE INDEX uk_curtida_usuario_tipo_conteudo_conteudo
ON curtida (usuario_id, tipo_conteudo_id, conteudo_id);
