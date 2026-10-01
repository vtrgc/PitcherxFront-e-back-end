CREATE TABLE contra_proposta(
	id_contra_proposta BIGSERIAL PRIMARY KEY,
	descricao_contra_proposta TEXT NOT NULL,
	valor_contra_proposta DECIMAL(19, 2) NULL,
	proposta_id BIGINT NOT NULL,
	FOREIGN KEY (proposta_id) REFERENCES proposta(id_proposta) ON UPDATE CASCADE ON DELETE CASCADE
);