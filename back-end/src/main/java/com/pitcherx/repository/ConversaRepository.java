package com.pitcherx.repository;

import com.pitcherx.model.Conversa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversaRepository extends JpaRepository<Conversa, Long> {

    /** Conversas do usuário, da atividade mais recente para a mais antiga. */
    @Query("SELECT c FROM Conversa c JOIN FETCH c.usuarioA JOIN FETCH c.usuarioB "
            + "WHERE c.usuarioA.idUsuario = :usuarioId OR c.usuarioB.idUsuario = :usuarioId "
            + "ORDER BY c.dataUltimaMensagem DESC NULLS LAST, c.idConversa DESC")
    List<Conversa> listarDoUsuario(@Param("usuarioId") Long usuarioId);

    /** O par precisa vir ordenado (menor id primeiro), como é gravado. */
    Optional<Conversa> findByUsuarioA_IdUsuarioAndUsuarioB_IdUsuario(Long usuarioAId, Long usuarioBId);

    default Optional<Conversa> buscarEntre(Long umId, Long outroId) {
        return umId < outroId
                ? findByUsuarioA_IdUsuarioAndUsuarioB_IdUsuario(umId, outroId)
                : findByUsuarioA_IdUsuarioAndUsuarioB_IdUsuario(outroId, umId);
    }

    /** Usado na exclusão de conta (depois de apagar as mensagens). */
    @Modifying
    @Query("DELETE FROM Conversa c WHERE c.usuarioA.idUsuario = :usuarioId OR c.usuarioB.idUsuario = :usuarioId")
    int apagarDoUsuario(@Param("usuarioId") Long usuarioId);
}
