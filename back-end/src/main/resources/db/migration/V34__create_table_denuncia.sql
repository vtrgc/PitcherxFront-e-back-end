CREATE TABLE denuncia (
    id_denuncia BIGSERIAL PRIMARY KEY,
    tipo_denuncia VARCHAR(20) NOT NULL CHECK (tipo_denuncia IN ('PERFIL', 'POSTAGEM', 'PROJETO', 'COMENTARIO')),
    alvo_id BIGINT NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ACEITA', 'REJEITADA')),
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_decisao TIMESTAMP,
    decisao_admin VARCHAR(1000)
);

CREATE INDEX idx_denuncia_status ON denuncia(status);
CREATE INDEX idx_denuncia_tipo_alvo ON denuncia(tipo_denuncia, alvo_id);