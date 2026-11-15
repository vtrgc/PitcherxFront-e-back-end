ALTER TABLE projeto
    ADD COLUMN IF NOT EXISTS visualizacoes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seguidores INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_projeto_visualizacoes ON projeto(visualizacoes);
CREATE INDEX IF NOT EXISTS idx_projeto_seguidores ON projeto(seguidores);
