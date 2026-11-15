CREATE TABLE nivel_conta (
    id_nivel_conta BIGSERIAL PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE CHECK (nome IN ('INICIANTE','EXPLORADOR','PROFISSIONAL','ESPECIALISTA','REFERENCIA','ELITE')),
    descricao VARCHAR(200),
    ordem INT NOT NULL DEFAULT 0
);

INSERT INTO nivel_conta (nome, descricao, ordem) VALUES
('INICIANTE', 'Usuário recém-cadastrado', 1),
('EXPLORADOR', 'Visualizou mais de um projeto', 2),
('PROFISSIONAL', 'Criou ao menos um projeto', 3),
('ESPECIALISTA', 'Criou projeto e é sócio/investidor em outros', 4),
('REFERENCIA', 'Tem ao menos um projeto com mais de 100 visualizações e 100 seguidores', 5),
('ELITE', 'Tem um projeto com mais de 200 visualizações e mais de 200 seguidores', 6);
