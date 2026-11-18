package com.pitcherx.dto.mensagem;

import com.pitcherx.dto.mensagem.SituacaoConexaoMensagem.Vinculo;
import com.pitcherx.model.StatusConexao;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.pitcherx.dto.mensagem.SituacaoConexaoMensagem.*;
import static org.junit.jupiter.api.Assertions.*;

/** Regra das mensagens: só conexão ACEITA (em qualquer sentido) libera o envio. */
class SituacaoConexaoMensagemTest {

    private static final Long EU = 1L;
    private static final Long OUTRO = 2L;
    private static final Long TERCEIRO = 3L;

    @Test
    void conexaoAceitaEmQualquerSentidoLibera() {
        assertEquals(CONECTADOS, avaliar(EU, OUTRO, true, List.of(new Vinculo(EU, OUTRO, StatusConexao.ACEITO))));
        assertEquals(CONECTADOS, avaliar(EU, OUTRO, true, List.of(new Vinculo(OUTRO, EU, StatusConexao.ACEITO))));
        assertTrue(CONECTADOS.podeEnviar());
        assertNull(CONECTADOS.motivo());
    }

    @Test
    void semConexaoNaoLibera() {
        SituacaoConexaoMensagem s = avaliar(EU, OUTRO, true, List.of());
        assertEquals(SEM_CONEXAO, s);
        assertFalse(s.podeEnviar());
        assertNotNull(s.motivo());
    }

    @Test
    void pendenteNaoLiberaEDizQuemPrecisaAceitar() {
        assertEquals(PENDENTE_ENVIADA, avaliar(EU, OUTRO, true, List.of(new Vinculo(EU, OUTRO, StatusConexao.PENDENTE))));
        assertEquals(PENDENTE_RECEBIDA, avaliar(EU, OUTRO, true, List.of(new Vinculo(OUTRO, EU, StatusConexao.PENDENTE))));
        assertFalse(PENDENTE_ENVIADA.podeEnviar());
        assertFalse(PENDENTE_RECEBIDA.podeEnviar());
    }

    @Test
    void recusadaNaoLibera() {
        assertEquals(RECUSADA, avaliar(EU, OUTRO, true, List.of(new Vinculo(EU, OUTRO, StatusConexao.RECUSADO))));
    }

    @Test
    void umaConexaoAceitaBastaMesmoComOutraPendenteOuRecusada() {
        assertEquals(CONECTADOS, avaliar(EU, OUTRO, true, List.of(
                new Vinculo(EU, OUTRO, StatusConexao.RECUSADO),
                new Vinculo(OUTRO, EU, StatusConexao.ACEITO))));
    }

    @Test
    void conexaoComTerceiroNaoConta() {
        assertEquals(SEM_CONEXAO, avaliar(EU, OUTRO, true, List.of(
                new Vinculo(EU, TERCEIRO, StatusConexao.ACEITO),
                new Vinculo(TERCEIRO, OUTRO, StatusConexao.ACEITO))));
    }

    @Test
    void contaInativaOuOProprioUsuarioNaoRecebem() {
        assertEquals(CONTA_INDISPONIVEL, avaliar(EU, OUTRO, false, List.of(new Vinculo(EU, OUTRO, StatusConexao.ACEITO))));
        assertEquals(MESMO_USUARIO, avaliar(EU, EU, true, List.of()));
    }
}
