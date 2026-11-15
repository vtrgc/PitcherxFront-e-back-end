-- A coluna "motivo" (V34) foi substituída por "categoria" + "descricao" (V35) e não existe mais
-- na entidade Denuncia. Como era NOT NULL sem default, todo INSERT de denúncia falhava em bancos
-- criados pelas migrations. A coluna é mantida (dados antigos), mas passa a ser opcional.
ALTER TABLE denuncia ALTER COLUMN motivo DROP NOT NULL;
