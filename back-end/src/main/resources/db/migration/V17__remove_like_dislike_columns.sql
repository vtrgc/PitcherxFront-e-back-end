ALTER TABLE postagem DROP COLUMN IF EXISTS like_postagem, DROP COLUMN IF EXISTS dislike_postagem;
ALTER TABLE comentario DROP COLUMN IF EXISTS like_comentario, DROP COLUMN IF EXISTS dislike_comentario;
ALTER TABLE sub_comentario DROP COLUMN IF EXISTS like_sub_comentario, DROP COLUMN IF EXISTS dislike_sub_comentario;