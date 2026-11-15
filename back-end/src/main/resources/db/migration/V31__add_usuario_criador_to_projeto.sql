DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projeto'
          AND column_name = 'usuario_criador_id'
    ) THEN
        ALTER TABLE projeto ADD COLUMN usuario_criador_id BIGINT;
    END IF;

    IF EXISTS (
        SELECT p.id_projeto
        FROM projeto p
        JOIN projeto_usuario pu ON pu.projeto_id = p.id_projeto
        JOIN tipo_vinculo tv ON tv.id_tipo_vinculo = pu.tipo_vinculo_id
        WHERE tv.nome_tipo_vinculo = 'CRIADOR'
        GROUP BY p.id_projeto
        HAVING COUNT(DISTINCT pu.usuario_id) > 1
    ) THEN
        RAISE EXCEPTION 'Há projetos com mais de um vínculo CRIADOR; corrija-os antes da migration.';
    END IF;

    UPDATE projeto p
    SET usuario_criador_id = (
        SELECT pu.usuario_id
        FROM projeto_usuario pu
        JOIN tipo_vinculo tv ON tv.id_tipo_vinculo = pu.tipo_vinculo_id
        WHERE pu.projeto_id = p.id_projeto
          AND tv.nome_tipo_vinculo = 'CRIADOR'
    )
    WHERE p.usuario_criador_id IS NULL
      AND EXISTS (
          SELECT 1
          FROM projeto_usuario pu
          JOIN tipo_vinculo tv ON tv.id_tipo_vinculo = pu.tipo_vinculo_id
          WHERE pu.projeto_id = p.id_projeto
            AND tv.nome_tipo_vinculo = 'CRIADOR'
      );

    IF EXISTS (SELECT 1 FROM projeto WHERE usuario_criador_id IS NULL) THEN
        RAISE EXCEPTION 'Há projetos sem vínculo CRIADOR; informe os criadores antes da migration.';
    END IF;

    ALTER TABLE projeto ALTER COLUMN usuario_criador_id SET NOT NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_projeto_usuario_criador'
          AND conrelid = 'public.projeto'::regclass
    ) THEN
        ALTER TABLE projeto
            ADD CONSTRAINT fk_projeto_usuario_criador
            FOREIGN KEY (usuario_criador_id) REFERENCES usuario(id_usuario)
            ON DELETE RESTRICT;
    END IF;
END;
$$;