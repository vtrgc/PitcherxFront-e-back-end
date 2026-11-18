package com.pitcherx.repository;

import com.pitcherx.model.Mensagem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    Optional<Mensagem> findByRemetente_IdUsuarioAndChaveCliente(Long remetenteId, String chaveCliente);

    /** Mensagens mais recentes primeiro (o serviço inverte para a ordem de leitura). */
    @Query("SELECT m FROM Mensagem m WHERE m.conversa.idConversa = :conversaId ORDER BY m.idMensagem DESC")
    List<Mensagem> ultimas(@Param("conversaId") Long conversaId, Pageable pageable);

    @Query("SELECT m FROM Mensagem m WHERE m.conversa.idConversa = :conversaId AND m.idMensagem < :antesDe "
            + "ORDER BY m.idMensagem DESC")
    List<Mensagem> anteriores(@Param("conversaId") Long conversaId, @Param("antesDe") Long antesDe, Pageable pageable);

    /** Criadas, lidas, editadas ou excluídas a partir de um instante (atualização incremental). */
    @Query("SELECT m FROM Mensagem m WHERE m.conversa.idConversa = :conversaId AND m.dataAtualizacao >= :desde "
            + "ORDER BY m.idMensagem ASC")
    List<Mensagem> alteradasDesde(@Param("conversaId") Long conversaId, @Param("desde") Instant desde, Pageable pageable);

    /** Última mensagem de cada conversa informada. */
    @Query("SELECT m FROM Mensagem m WHERE m.idMensagem IN ("
            + "SELECT MAX(m2.idMensagem) FROM Mensagem m2 WHERE m2.conversa.idConversa IN :conversaIds "
            + "GROUP BY m2.conversa.idConversa)")
    List<Mensagem> ultimasDasConversas(@Param("conversaIds") Collection<Long> conversaIds);

    /** [conversaId, quantidade] das mensagens recebidas e ainda não lidas. */
    @Query("SELECT m.conversa.idConversa, COUNT(m) FROM Mensagem m WHERE m.conversa.idConversa IN :conversaIds "
            + "AND m.remetente.idUsuario <> :usuarioId AND m.lida = false AND m.excluida = false "
            + "GROUP BY m.conversa.idConversa")
    List<Object[]> naoLidasPorConversa(@Param("conversaIds") Collection<Long> conversaIds, @Param("usuarioId") Long usuarioId);

    @Query("SELECT COUNT(m) FROM Mensagem m WHERE (m.conversa.usuarioA.idUsuario = :usuarioId "
            + "OR m.conversa.usuarioB.idUsuario = :usuarioId) AND m.remetente.idUsuario <> :usuarioId "
            + "AND m.lida = false AND m.excluida = false")
    long contarNaoLidas(@Param("usuarioId") Long usuarioId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Mensagem m SET m.lida = true, m.dataLeitura = :agora, m.dataAtualizacao = :agora "
            + "WHERE m.conversa.idConversa = :conversaId AND m.remetente.idUsuario <> :usuarioId AND m.lida = false")
    int marcarComoLidas(@Param("conversaId") Long conversaId, @Param("usuarioId") Long usuarioId, @Param("agora") Instant agora);

    /** Usado na exclusão de conta: as mensagens das conversas de que o usuário participa. */
    @Modifying
    @Query("DELETE FROM Mensagem m WHERE m.conversa.idConversa IN (SELECT c.idConversa FROM Conversa c "
            + "WHERE c.usuarioA.idUsuario = :usuarioId OR c.usuarioB.idUsuario = :usuarioId)")
    int apagarDasConversasDoUsuario(@Param("usuarioId") Long usuarioId);
}
