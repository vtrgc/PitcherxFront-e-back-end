package com.pitcherx.dto.mensagem;

import com.pitcherx.model.StatusConexao;

import java.util.List;
import java.util.Objects;

/**
 * Se duas pessoas podem trocar mensagens e, se não, por quê.
 *
 * Regra: só quem tem uma conexão ACEITA entre si (em qualquer sentido) troca mensagens.
 * Solicitação pendente, recusada ou removida (a remoção apaga a conexão) não libera.
 */
public enum SituacaoConexaoMensagem {
    CONECTADOS(null),
    PENDENTE_ENVIADA("Sua solicitação de conexão ainda não foi aceita. As mensagens são liberadas quando a conexão for aceita."),
    PENDENTE_RECEBIDA("Aceite a solicitação de conexão para liberar as mensagens."),
    RECUSADA("A solicitação de conexão foi recusada. Só é possível trocar mensagens com uma conexão aceita."),
    SEM_CONEXAO("Vocês precisam estar conectados para trocar mensagens."),
    CONTA_INDISPONIVEL("Esta conta não está disponível para mensagens."),
    MESMO_USUARIO("Você não pode enviar mensagens para si mesmo.");

    private final String motivo;

    SituacaoConexaoMensagem(String motivo) {
        this.motivo = motivo;
    }

    /** Explicação para quem não pode enviar (null quando pode). */
    public String motivo() {
        return motivo;
    }

    public boolean podeEnviar() {
        return this == CONECTADOS;
    }

    /** Uma conexão entre as duas pessoas (seguidor → seguido). */
    public record Vinculo(Long seguidorId, Long seguidoId, StatusConexao status) {
        public static Vinculo de(Object[] linha) {
            return new Vinculo((Long) linha[0], (Long) linha[1], (StatusConexao) linha[2]);
        }
    }

    /**
     * @param eu         quem quer enviar
     * @param outro      destinatário
     * @param outroAtivo a conta do destinatário está ativa
     * @param vinculos   conexões entre os dois (qualquer sentido)
     */
    public static SituacaoConexaoMensagem avaliar(Long eu, Long outro, boolean outroAtivo, List<Vinculo> vinculos) {
        if (Objects.equals(eu, outro)) return MESMO_USUARIO;
        if (!outroAtivo) return CONTA_INDISPONIVEL;
        List<Vinculo> entreOsDois = vinculos.stream()
                .filter(v -> (Objects.equals(v.seguidorId(), eu) && Objects.equals(v.seguidoId(), outro))
                        || (Objects.equals(v.seguidorId(), outro) && Objects.equals(v.seguidoId(), eu)))
                .toList();
        if (entreOsDois.stream().anyMatch(v -> v.status() == StatusConexao.ACEITO)) return CONECTADOS;
        if (entreOsDois.stream().anyMatch(v -> v.status() == StatusConexao.PENDENTE && Objects.equals(v.seguidorId(), eu))) {
            return PENDENTE_ENVIADA;
        }
        if (entreOsDois.stream().anyMatch(v -> v.status() == StatusConexao.PENDENTE)) return PENDENTE_RECEBIDA;
        if (entreOsDois.stream().anyMatch(v -> v.status() == StatusConexao.RECUSADO)) return RECUSADA;
        return SEM_CONEXAO;
    }
}
