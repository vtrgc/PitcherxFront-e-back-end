-- A V25 pretendia marcar como verificadas as contas ativas criadas antes do código de
-- verificação, mas o UPDATE dela nunca alterava nada: a coluna nasce NOT NULL DEFAULT FALSE e a
-- condição era "verificado_usuario IS NULL".
--
-- Agora o front pede o código no primeiro acesso de quem ainda não verificou. Contas ativas sem
-- código pendente (criadas antes do recurso, ou o admin semeado) nunca receberam um código e
-- ficariam presas nessa tela, então passam a contar como verificadas. Contas com código pendente
-- continuam precisando digitá-lo (e podem pedir um novo código na tela).
UPDATE usuario
   SET verificado_usuario = TRUE
 WHERE is_active_usuario = TRUE
   AND verificado_usuario IS NOT TRUE
   AND codigo_verificacao_usuario IS NULL;
