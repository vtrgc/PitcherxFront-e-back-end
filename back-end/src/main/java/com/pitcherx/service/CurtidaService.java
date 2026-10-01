package com.pitcherx.service;

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
        if(!curtidaRepository.existsById(idCurtida)){
            throw new RuntimeException("Sem curtida com o ID informado!");
        }
        try {
            curtidaRepository.deleteById(idCurtida);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar a curtida, pois ela está associada a outras entidades.!");
        }
    }

    @Transactional
    public void removerCurtidaPorUsuarioConteudo(Long usuarioId, Long tipoConteudoId, Long conteudoId) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Sem usuario com o ID informado!"));

        tipoConteudoRepository.findById(tipoConteudoId)
                .orElseThrow(() -> new RuntimeException("Sem tipo de conteudo com o ID informado!"));

        Curtida curtida = curtidaRepository.findByUsuario_IdUsuarioAndTipoConteudo_IdTipoConteudoAndConteudoId(usuarioId, tipoConteudoId, conteudoId)
                .orElseThrow(() -> new RuntimeException("Curtida não encontrada para o usuário e conteúdo informados!"));

        curtidaRepository.delete(curtida);
    }

}
