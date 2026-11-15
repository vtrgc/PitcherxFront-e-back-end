ALTER TABLE perfil_usuario ADD COLUMN biografia TEXT;
ALTER TABLE usuario ADD COLUMN codigo_verificacao_usuario VARCHAR(6) DEFAULT NULL;
ALTER TABLE usuario ADD COLUMN verificado_usuario BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE usuario SET verificado_usuario = TRUE WHERE is_active_usuario = TRUE AND verificado_usuario IS NULL;
UPDATE perfil_usuario SET biografia = '' WHERE biografia IS NULL;