package com.pitcherx.service;

import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioRequestDTO;
import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioResponseDTO;
import com.pitcherx.mapper.ProjetoUsuarioMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.ProjetoUsuario;
import com.pitcherx.model.TermoVinculo;
import com.pitcherx.model.TipoVinculo;
import com.pitcherx.model.TipoVinculoEnum;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.TermoVinculoRepository;
import com.pitcherx.repository.TipoVinculoRepository;
import com.pitcherx.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProjetoUsuarioService {

private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final ProjetoUsuarioMapper projetoUsuarioMapper;
    private final ProjetoRepository projetoRepository;
    private final TermoVinculoRepository termoVinculoRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoVinculoRepository tipoVinculoRepository;

    public ProjetoUsuarioService(ProjetoUsuarioRepository projetoUsuarioRepository,
                                 ProjetoUsuarioMapper projetoUsuarioMapper, ProjetoRepository projetoRepository,
                                 TermoVinculoRepository termoVinculoRepository, UsuarioRepository usuarioRepository,
                                 TipoVinculoRepository tipoVinculoRepository) {
        this.projetoUsuarioRepository = projetoUsuarioRepository;
        this.projetoUsuarioMapper = projetoUsuarioMapper;
        this.projetoRepository = projetoRepository;
        this.termoVinculoRepository = termoVinculoRepository;
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

    @Transactional
    public ProjetoUsuarioResponseDTO aceitarTermos(Long projetoId, Long usuarioId, List<Long> termoIds) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        // Verificar se existem todos os termos solicitados para este projeto
        List<TermoVinculo> termos = termoVinculoRepository.findByProjeto_IdProjeto(projetoId)
                .stream()
                .filter(termo -> termoIds.contains(termo.getIdTermoVinculo()))
                .collect(java.util.stream.Collectors.toList());
        if (termos.size() != termoIds.size()) {
            throw new IllegalArgumentException("Um ou mais termos informados não foram encontrados neste projeto.");
        }

        // Verificar se todos os termos obrigatórios foram aceitos
        List<TermoVinculo> termosObrigatorios = termoVinculoRepository.findByProjeto_IdProjetoAndObrigatorioTrue(projetoId);
        boolean todosObrigatoriosAceitos = termosObrigatorios.stream()
                .allMatch(termo -> termoIds.contains(termo.getIdTermoVinculo()));

        if (todosObrigatoriosAceitos) {
            // Verificar se já existe um vínculo para este usuário e projeto
            Optional<ProjetoUsuario> optional = projetoUsuarioRepository
                    .findByProjeto_IdProjetoAndUsuario_IdUsuario(projetoId, usuarioId);

            if (optional.isPresent()) {
                ProjetoUsuario projetoUsuario = optional.get();
                // Se já existe vínculo, atualizar para aceitouTermos=true
                // Usar getBoolean para acessar o valor do campo Boolean
                Boolean aceitou = projetoUsuario.getAceitouTermos();
                if (aceitou == null || !aceitou) {
                    projetoUsuario.setAceitouTermos(true);
                    projetoUsuario.setDataAceite(LocalDateTime.now());
                    ProjetoUsuario salvo = projetoUsuarioRepository.save(projetoUsuario);
                    return projetoUsuarioMapper.toDTO(salvo);
                }
                return projetoUsuarioMapper.toDTO(projetoUsuario);
            } else {
                Optional<TipoVinculo> tipoVisualizadorOptional = tipoVinculoRepository.findByNomeTipoVinculo(TipoVinculoEnum.VISUALIZADOR.toString());
                if (tipoVisualizadorOptional.isEmpty()) {
                    throw new EntityNotFoundException("Sem tipo de vínculo VISUALIZADOR!");
                }
                TipoVinculo tipoVisualizador = tipoVisualizadorOptional.get();

                ProjetoUsuario novoVinculo = new ProjetoUsuario();
                novoVinculo.setProjeto(projeto);
                novoVinculo.setUsuario(usuario);
                novoVinculo.setTipoVinculo(tipoVisualizador);
                novoVinculo.setAceitouTermos(true);
                novoVinculo.setDataAceite(LocalDateTime.now());

                ProjetoUsuario salvo = projetoUsuarioRepository.save(novoVinculo);
                return projetoUsuarioMapper.toDTO(salvo);
            }
        } else {
            throw new IllegalArgumentException("É necessário aceitar todos os termos obrigatórios antes de prosseguir.");
        }
    }

    /**
     * Transforma o usuário em VISUALIZADOR de um projeto (após aceitar termos)
     * @param projetoId ID do projeto
     * @param usuarioId ID do usuário
     * @return O ProjetoUsuario atualizado com tipo VISUALIZADOR
     */
    @Transactional
    public ProjetoUsuarioResponseDTO tornarVisualizador(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        // Buscar o tipo VISUALIZADOR
        Optional<TipoVinculo> tipoVisualizadorOptional = tipoVinculoRepository.findByNomeTipoVinculo(TipoVinculoEnum.VISUALIZADOR.toString());
        if (!tipoVisualizadorOptional.isPresent()) {
            throw new EntityNotFoundException("Sem tipo de vínculo VISUALIZADOR!");
        }
        TipoVinculo tipoVisualizador = tipoVisualizadorOptional.get();

        // Verificar se já existe vínculo
        Optional<ProjetoUsuario> optional = projetoUsuarioRepository
                .findByProjeto_IdProjetoAndUsuario_IdUsuario(projetoId, usuarioId);

        if (optional.isPresent()) {
            ProjetoUsuario projetoUsuario = optional.get();
            // Atualizar tipo para VISUALIZADOR se não for já
            if (!projetoUsuario.getTipoVinculo().getNomeTipoVinculo().equals(TipoVinculoEnum.VISUALIZADOR.toString())) {
                projetoUsuario.setTipoVinculo(tipoVisualizador);
                // Se aceitou termos, manter dataAceite, senão definir agora
                if (projetoUsuario.getAceitouTermos()) {
                    projetoUsuario.setDataAceite(LocalDateTime.now());
                } else {
                    projetoUsuario.setDataAceite(LocalDateTime.now());
                }
                ProjetoUsuario salvo = projetoUsuarioRepository.save(projetoUsuario);
                return projetoUsuarioMapper.toDTO(salvo);
            }
            return projetoUsuarioMapper.toDTO(projetoUsuario);
        } else {
            // Criar novo vínculo com tipo VISUALIZADOR
            ProjetoUsuario novoVinculo = new ProjetoUsuario();
            novoVinculo.setProjeto(projeto);
            novoVinculo.setUsuario(usuario);
            novoVinculo.setTipoVinculo(tipoVisualizador);
            novoVinculo.setAceitouTermos(true);
            novoVinculo.setDataAceite(LocalDateTime.now());

            ProjetoUsuario salvo = projetoUsuarioRepository.save(novoVinculo);
            return projetoUsuarioMapper.toDTO(salvo);
        }
    }

    /**
     * Verifica o vínculo atual do usuário para um projeto
     * @param projetoId ID do projeto
     * @param usuarioId ID do usuário
     * @return ProjetoUsuarioResponseDTO com o vínculo atual ou null
     */
    @Transactional(readOnly = true)
    public ProjetoUsuarioResponseDTO getVinculoPorProjetoEUsuario(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        return projetoUsuarioRepository.findByProjeto_IdProjetoAndUsuario_IdUsuario(projetoId, usuarioId)
                .map(projetoUsuarioMapper::toDTO)
                .orElse(null);
    }
}