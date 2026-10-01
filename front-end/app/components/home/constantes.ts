/** id do <style> que o script inicial usa para esconder o palco até o motor posicionar a cena. */
export const ID_ESPERA = "hx-espera";
/** Evento que o motor escuta para levar à cena final (funciona com ou sem Lenis). */
export const EVENTO_PULAR = "hx:pular";
/**
 * Preferência salva (localStorage) de quem tem "movimento reduzido" no sistema e mesmo assim
 * escolheu a experiência animada (botão em /como-funciona). Sem ela, essas pessoas vão direto
 * para a versão sem animação.
 */
export const CHAVE_ANIMAR = "pitcherx:home-animada";
/** Página inicial sem animação (para quem prefere ler, movimento reduzido ou sem JavaScript). */
export const ROTA_SEM_ANIMACAO = "/como-funciona";
