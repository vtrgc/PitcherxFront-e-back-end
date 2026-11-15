package com.pitcherx.service;

import com.pitcherx.security.Permissoes;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import com.pitcherx.model.Curtida;
import com.pitcherx.model.TipoConteudo;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.CurtidaRepository;
import com.pitcherx.repository.TipoConteudoRepository;
import com.pitcherx.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CurtidaService {

    private final CurtidaRepository curtidaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoConteudoRepository tipoConteudoRepository;

    @Autowired
    private Permissoes permissoes;

    public CurtidaService(CurtidaRepository curtidaRepository,
                          UsuarioRepository usuarioRepository, TipoConteudoRepository tipoConteudoRepository){
        this.curtidaRepository = curtidaRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoConteudoRepository = tipoConteudoRepository;
    }

    public Integer contarCurtidasPorConteudo(Long tipoConteudoId, Long conteudoId){
        tipoConteudoRepository.findById(tipoConteudoId)
                .orElseThrow(() -> new RuntimeException("Sem tipo de conteudo com o ID informado!"));

        return Math.toIntExact(curtidaRepository.countByTipoConteudo_IdTipoConteudoAndConteudoId(tipoConteudoId, conteudoId));
    }

    public boolean usuarioJaCurtiuConteudo(Long usuarioId, Long tipoConteudoId, Long conteudoId) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Sem usuario com o ID informado!"));

        tipoConteudoRepository.findById(tipoConteudoId)
                .orElseThrow(() -> new RuntimeException("Sem tipo de conteudo com o ID informado!"));

        return curtidaRepository.existsByUsuario_IdUsuarioAndTipoConteudo_IdTipoConteudoAndConteudoId(usuarioId, tipoConteudoId, conteudoId);
    }

    public Map<String, Object> consultarStatusCurtida(Long usuarioId, Long tipoConteudoId, Long conteudoId) {
        return Map.of(
                "jaCurtiu", usuarioJaCurtiuConteudo(usuarioId, tipoConteudoId, conteudoId),
                "quantidadeCurtidas", contarCurtidasPorConteudo(tipoConteudoId, conteudoId)
        );
    }

    @Transactional
    public Long curtirConteudo(Long usuarioId, Long tipoConteudoId, Long conteudoId){
        permissoes.exigirProprio(usuarioId, "Você só pode curtir em seu próprio nome.");

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Sem usuario com o ID informado!"));

        TipoConteudo tipoConteudo = tipoConteudoRepository.findById(tipoConteudoId)
                .orElseThrow(() -> new RuntimeException("Sem tipo de conteudo com o ID informado!"));

        if (curtidaRepository.existsByUsuario_IdUsuarioAndTipoConteudo_IdTipoConteudoAndConteudoId(usuarioId, tipoConteudoId, conteudoId)) {
            throw new IllegalStateException("O usuário já curtiu este conteúdo.");
        }

        Curtida curtida = new Curtida();

        curtida.setUsuario(usuario);
        curtida.setTipoConteudo(tipoConteudo);
        curtida.setConteudoId(conteudoId);
        curtida.setDataCurtida(LocalDateTime.now());

        Curtida saved = curtidaRepository.save(curtida);
        return saved.getIdCurtida();
    }

    //metodo de remoção de curtida básico, vou fazer um com verificação de usuário, tipo de conteudo e conteudo depois
    @Transactional
    public void deletarCurtida(Long idCurtida){
        Curtida existente = curtidaRepository.findById(idCurtida)
                .orElseThrow(() -> new EntityNotFoundException("Sem curtida com o ID informado!"));
        permissoes.exigirProprioOuAdmin(existente.getUsuario().getIdUsuario(), "Você só pode remover as suas curtidas.");
        try {
            curtidaRepository.deleteById(idCurtida);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar a curtida, pois ela está associada a outras entidades.!");
        }
    }

    @Transactional
    public void removerCurtidaPorUsuarioConteudo(Long usuarioId, Long tipoConteudoId, Long conteudoId) {
        permissoes.exigirProprio(usuarioId, "Você só pode remover as suas curtidas.");
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuario com o ID informado!"));

        tipoConteudoRepository.findById(tipoConteudoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem tipo de conteudo com o ID informado!"));

        Curtida curtida = curtidaRepository.findByUsuario_IdUsuarioAndTipoConteudo_IdTipoConteudoAndConteudoId(usuarioId, tipoConteudoId, conteudoId)
                .orElseThrow(() -> new EntityNotFoundException("Curtida não encontrada para o usuário e conteúdo informados!"));

        curtidaRepository.delete(curtida);
    }

}
