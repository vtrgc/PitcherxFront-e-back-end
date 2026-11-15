-- Migração V33: Adicionar/garantir colunas no projeto com valores padrão
-- Colunas já definidas no entity Projeto.java como NOT NULL

-- Garantir que a coluna investimento_minimo exista e tenha valor padrão 0
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projeto' AND column_name = 'investimento_minimo') THEN
        ALTER TABLE projeto ADD COLUMN investimento_minimo DOUBLE PRECISION NOT NULL DEFAULT 0;
    ELSE
        -- Se já existe, atualizar valores nulos para 0
        UPDATE projeto SET investimento_minimo = 0 WHERE investimento_minimo IS NULL;
        -- Tornar NOT NULL se ainda não for
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projeto_investimento_minimo_notnull') THEN
            ALTER TABLE projeto ALTER COLUMN investimento_minimo SET NOT NULL;
        END IF;
    END IF;
END
$$;

-- Garantir que a coluna participacao_oferecida exista e tenha valor padrão 0
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projeto' AND column_name = 'participacao_oferecida') THEN
        ALTER TABLE projeto ADD COLUMN participacao_oferecida INTEGER NOT NULL DEFAULT 0;
    ELSE
        -- Se já existe, atualizar valores nulos para 0
        UPDATE projeto SET participacao_oferecida = 0 WHERE participacao_oferecida IS NULL;
        -- Tornar NOT NULL se ainda não for
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projeto_participacao_oferecida_notnull') THEN
            ALTER TABLE projeto ALTER COLUMN participacao_oferecida SET NOT NULL;
        END IF;
    END IF;
END
$$;

-- Garantir que a coluna uso_recursos exista (nullable por default)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projeto' AND column_name = 'uso_recursos') THEN
        ALTER TABLE projeto ADD COLUMN uso_recursos VARCHAR(255);
    END IF;
END
$$;