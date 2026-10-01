ALTER TABLE endereco
    ADD COLUMN uf VARCHAR(2),
    ADD COLUMN complemento VARCHAR(255);
    
ALTER TABLE endereco RENAME COLUMN bairro_endereco TO bairro;
ALTER TABLE endereco RENAME COLUMN rua_endereco TO logradouro;
ALTER TABLE endereco RENAME COLUMN numero_endereco TO numero_casa;

ALTER TABLE endereco
    ALTER COLUMN uf SET NOT NULL,
    ALTER COLUMN bairro SET NOT NULL,
    ALTER COLUMN logradouro SET NOT NULL,
    ALTER COLUMN numero_casa SET NOT NULL;
    
ALTER TABLE endereco
    ALTER COLUMN numero_casa TYPE INTEGER USING numero_casa::INTEGER;
    
ALTER TABLE endereco
    ALTER COLUMN cep TYPE VARCHAR(8);