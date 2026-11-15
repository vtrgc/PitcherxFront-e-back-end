-- Guarda a justificativa da decisão da contraproposta (antes só seguia na notificação).
ALTER TABLE contra_proposta ADD COLUMN IF NOT EXISTS justificativa_decisao TEXT;
