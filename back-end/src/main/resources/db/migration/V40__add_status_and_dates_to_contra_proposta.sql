ALTER TABLE contra_proposta
    ADD COLUMN IF NOT EXISTS status_contra_proposta VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status_contra_proposta IN ('PENDENTE', 'ACEITA', 'REJEITADA')),
    ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP,
    ADD COLUMN IF NOT EXISTS data_decisao TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_contra_proposta_status ON contra_proposta(status_contra_proposta);
CREATE INDEX IF NOT EXISTS idx_contra_proposta_data_criacao ON contra_proposta(data_criacao);
