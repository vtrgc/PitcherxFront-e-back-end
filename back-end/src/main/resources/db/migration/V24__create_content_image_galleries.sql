CREATE TABLE postagem_imagem (
    id_postagem_imagem BIGSERIAL PRIMARY KEY,
    postagem_id BIGINT NOT NULL REFERENCES postagem(id_postagem) ON DELETE CASCADE,
    url_imagem VARCHAR(2048) NOT NULL,
    ordem INTEGER NOT NULL,
    CONSTRAINT uk_postagem_imagem_ordem UNIQUE (postagem_id, ordem)
);

CREATE TABLE projeto_imagem (
    id_projeto_imagem BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL REFERENCES projeto(id_projeto) ON DELETE CASCADE,
    url_imagem VARCHAR(2048) NOT NULL,
    ordem INTEGER NOT NULL,
    CONSTRAINT uk_projeto_imagem_ordem UNIQUE (projeto_id, ordem)
);

ALTER TABLE postagem ALTER COLUMN url_imagem_postagem TYPE VARCHAR(2048);
ALTER TABLE projeto ALTER COLUMN url_imagem_projeto TYPE VARCHAR(2048);

INSERT INTO postagem_imagem (postagem_id, url_imagem, ordem)
SELECT id_postagem, url_imagem_postagem, 0
FROM postagem
WHERE url_imagem_postagem IS NOT NULL AND BTRIM(url_imagem_postagem) <> '';

INSERT INTO projeto_imagem (projeto_id, url_imagem, ordem)
SELECT id_projeto, url_imagem_projeto, 0
FROM projeto
WHERE url_imagem_projeto IS NOT NULL AND BTRIM(url_imagem_projeto) <> '';
