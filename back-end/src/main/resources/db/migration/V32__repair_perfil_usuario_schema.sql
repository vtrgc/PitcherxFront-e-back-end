DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'perfil_usuario'
          AND column_name = 'perfil_usuario'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'perfil_usuario'
          AND column_name = 'id_perfil_usuario'
    ) THEN
        ALTER TABLE perfil_usuario RENAME COLUMN perfil_usuario TO id_perfil_usuario;
    END IF;

    ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS usuario_id BIGINT;

    IF EXISTS (
        SELECT usuario_id
        FROM perfil_usuario
        WHERE usuario_id IS NOT NULL
        GROUP BY usuario_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Há mais de um perfil associado ao mesmo usuário; corrija os vínculos antes da migration.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM perfil_usuario perfil
        LEFT JOIN usuario ON usuario.id_usuario = perfil.usuario_id
        WHERE perfil.usuario_id IS NOT NULL
          AND usuario.id_usuario IS NULL
    ) THEN
        RAISE EXCEPTION 'Há perfis associados a usuários inexistentes; corrija os vínculos antes da migration.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_perfil_usuario_usuario'
          AND conrelid = 'public.perfil_usuario'::regclass
    ) THEN
        ALTER TABLE perfil_usuario
            ADD CONSTRAINT fk_perfil_usuario_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM perfil_usuario
        WHERE usuario_id IS NULL
    ) THEN
        ALTER TABLE perfil_usuario ALTER COLUMN usuario_id SET NOT NULL;
    END IF;
END;
$$;

ALTER TABLE perfil_usuario ALTER COLUMN identificador DROP NOT NULL;
ALTER TABLE endereco ALTER COLUMN uf DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_perfil_usuario_usuario_id
    ON perfil_usuario (usuario_id)
    WHERE usuario_id IS NOT NULL;
