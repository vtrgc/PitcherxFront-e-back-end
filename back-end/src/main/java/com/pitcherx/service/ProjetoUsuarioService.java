package com.pitcherx.service;

import java.util.List;

import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioRequestDTO;
import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioResponseDTO;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pitcherx.mapper.ProjetoUsuarioMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.ProjetoUsuario;
import com.pitcherx.model.TipoVinculo;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.TipoVinculoRepository;
import com.pitcherx.repository.UsuarioRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProjetoUsuarioService {

    private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final ProjetoUsuarioMapper projetoUsuarioMapper;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoVinculoRepository tipoVinculoRepository;

    public ProjetoUsuarioService(ProjetoUsuarioRepository projetoUsuarioRepository,
                                 ProjetoUsuarioMapper projetoUsuarioMapper, ProjetoRepository projetoRepository,
                                 UsuarioRepository usuarioRepository, TipoVinculoRepository tipoVinculoRepository) {
        this.projetoUsuarioRepository = projetoUsuarioRepository;
        this.projetoUsuarioMapper = projetoUsuarioMapper;
        this.projetoRepository = projetoRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoVinculoRepository = tipoVinculoRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjetoUsuarioResponseDTO> listarPorProjeto(Long idProjeto) {
        if (!projetoRepository.existsById(idProjeto)) {
            throw new EntityNotFoundException("Sem projeto com o ID informado!");
        }
        return projetoUsuarioRepository.findByProjeto_IdProjeto(idProjeto).stream()
                .map(projetoUsuarioMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjetoUsuarioResponseDTO> listarPorUsuario(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new EntityNotFoundException("Sem usuário com o ID informado!");
        }
        return projetoUsuarioRepository.findByUsuario_IdUsuario(idUsuario).stream()
                .map(projetoUsuarioMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjetoUsuarioResponseDTO buscarPorId(Long idProjetoUsuario) {
        ProjetoUsuario projetoUsuario = projetoUsuarioRepository.findById(idProjetoUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem vínculo com o ID informado!"));
        return projetoUsuarioMapper.toDTO(projetoUsuario);
    }

    @Transactional
    public ProjetoUsuarioResponseDTO criarVinculo(ProjetoUsuarioRequestDTO projetoUsuarioRequestDTO) {
        Projeto projeto = projetoRepository.findById(projetoUsuarioRequestDTO.projetoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Usuario usuario = usuarioRepository.findById(projetoUsuarioRequestDTO.usuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        TipoVinculo tipoVinculo = tipoVinculoRepository.findById(projetoUsuarioRequestDTO.tipoVinculoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem tipo de vínculo com o ID informado!"));

        if (projetoUsuarioRepository.existsByUsuario_IdUsuarioAndProjeto_IdProjetoAndTipoVinculo_IdTipoVinculo(
                projetoUsuarioRequestDTO.projetoId(), projetoUsuarioRequestDTO.usuarioId(), projetoUsuarioRequestDTO.tipoVinculoId())) {
            throw new IllegalArgumentException("Este usuário já possui esse vínculo com o projeto.");
        }

        ProjetoUsuario projetoUsuario = new ProjetoUsuario();
        projetoUsuario.setProjeto(projeto);
        projetoUsuario.setUsuario(usuario);
        projetoUsuario.setTipoVinculo(tipoVinculo);

        ProjetoUsuario salvo = projetoUsuarioRepository.save(projetoUsuario);
        return projetoUsuarioMapper.toDTO(salvo);
    }

    @Transactional
    public ProjetoUsuarioResponseDTO atualizarVinculo(Long idProjetoUsuario, ProjetoUsuarioRequestDTO projetoUsuarioRequestDTO) {
        ProjetoUsuario projetoUsuario = projetoUsuarioRepository.findById(idProjetoUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem vínculo com o ID informado!"));

        Projeto projeto = projetoRepository.findById(projetoUsuarioRequestDTO.projetoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Usuario usuario = usuarioRepository.findById(projetoUsuarioRequestDTO.usuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        TipoVinculo tipoVinculo = tipoVinculoRepository.findById(projetoUsuarioRequestDTO.tipoVinculoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem tipo de vínculo com o ID informado!"));

        projetoUsuario.setProjeto(projeto);
        projetoUsuario.setUsuario(usuario);
        projetoUsuario.setTipoVinculo(tipoVinculo);

        ProjetoUsuario salvo = projetoUsuarioRepository.save(projetoUsuario);
        return projetoUsuarioMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarVinculo(Long idProjetoUsuario) {
        if (!projetoUsuarioRepository.existsById(idProjetoUsuario)) {
            throw new EntityNotFoundException("Sem vínculo com o ID informado!");
        }
        try {
            projetoUsuarioRepository.deleteById(idProjetoUsuario);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar este vínculo, pois ele está associado a outras entidades.");
        }
    }
}