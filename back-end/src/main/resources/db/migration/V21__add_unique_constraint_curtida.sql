DELETE FROM curtida duplicada
USING curtida original
WHERE duplicada.usuario_id = original.usuario_id
  AND duplicada.tipo_conteudo_id = original.tipo_conteudo_id
  AND duplicada.conteudo_id = original.conteudo_id
  AND duplicada.id_curtida > original.id_curtida;

CREATE UNIQUE INDEX uk_curtida_usuario_tipo_conteudo_conteudo
ON curtida (usuario_id, tipo_conteudo_id, conteudo_id);
