CREATE TABLE subarea (
    id_sub_area BIGSERIAL PRIMARY KEY,
    nome_sub_area VARCHAR(255) NOT NULL,
    descricao_sub_area TEXT NOT NULL,
    area_id BIGSERIAL NOT NULL,
    FOREIGN KEY (area_id) REFERENCES area(id_area) ON DELETE CASCADE ON UPDATE CASCADE
);

