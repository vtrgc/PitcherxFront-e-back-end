-- Mensagens privadas entre usuários. Só quem tem uma conexão ACEITA (tabela conexao, em
-- qualquer sentido) pode enviar; a regra é aplicada no MensagemService.

-- Uma conversa por par de usuários. O par é guardado sempre na mesma ordem (menor id em
-- usuario_a_id) para que a restrição única impeça duas conversas entre as mesmas pessoas.
CREATE TABLE IF NOT EXISTS conversa (
    id_conversa          BIGSERIAL PRIMARY KEY,
    usuario_a_id         BIGINT      NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    usuario_b_id         BIGINT      NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    data_criacao         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_ultima_mensagem TIMESTAMPTZ,
    CONSTRAINT ck_conversa_par_ordenado CHECK (usuario_a_id < usuario_b_id),
    CONSTRAINT uk_conversa_par UNIQUE (usuario_a_id, usuario_b_id)
);

-- usuario_a_id já é coberto pelo índice da restrição única; falta o lado b.
CREATE INDEX IF NOT EXISTS idx_conversa_usuario_b ON conversa (usuario_b_id);

CREATE TABLE IF NOT EXISTS mensagem (
    id_mensagem      BIGSERIAL PRIMARY KEY,
    conversa_id      BIGINT      NOT NULL REFERENCES conversa (id_conversa) ON DELETE CASCADE,
    remetente_id     BIGINT      NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    conteudo         TEXT        NOT NULL,
    data_envio       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lida             BOOLEAN     NOT NULL DEFAULT FALSE,
    data_leitura     TIMESTAMPTZ,
    data_edicao      TIMESTAMPTZ,
    excluida         BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Muda a cada criação, leitura, edição ou exclusão: o front busca só o que mudou.
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Identificador gerado pelo front para cada envio: um reenvio após falha de rede não
    -- duplica a mensagem.
    chave_cliente    VARCHAR(64),
    CONSTRAINT uk_mensagem_chave_cliente UNIQUE (remetente_id, chave_cliente)
);

-- Histórico paginado e última mensagem de cada conversa.
CREATE INDEX IF NOT EXISTS idx_mensagem_conversa ON mensagem (conversa_id, id_mensagem);
-- Atualização incremental (o que mudou desde a última consulta).
CREATE INDEX IF NOT EXISTS idx_mensagem_conversa_atualizacao ON mensagem (conversa_id, data_atualizacao);
-- Contagem de não lidas.
CREATE INDEX IF NOT EXISTS idx_mensagem_nao_lidas ON mensagem (conversa_id, remetente_id) WHERE lida = FALSE AND excluida = FALSE;
