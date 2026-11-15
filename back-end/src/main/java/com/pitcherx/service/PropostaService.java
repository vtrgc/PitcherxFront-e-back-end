package com.pitcherx.service;

import com.pitcherx.dto.contraProposta.ContraPropostaRequestDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaResponseDTO;
import com.pitcherx.dto.proposta.PropostaRequestDTO;
import com.pitcherx.dto.proposta.PropostaResponseDTO;
import com.pitcherx.exceptions.BusinessException;
import com.pitcherx.mapper.ContraPropostaMapper;
import com.pitcherx.mapper.PropostaMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.ProjetoUsuario;
import com.pitcherx.model.Proposta;
import com.pitcherx.model.TipoVinculo;
import com.pitcherx.model.Usuario;
import com.pitcherx.model.Contrato;
import com.pitcherx.repository.ContraPropostaRepository;
import com.pitcherx.repository.ContratoRepository;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.PropostaRepository;
import com.pitcherx.repository.TipoVinculoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PropostaService {

    private final PropostaRepository propostaRepository;
    private final PropostaMapper propostaMapper;
    private final ProjetoRepository projetoRepository;
    private final ContratoRepository contratoRepository;
    private final ContraPropostaRepository contraPropostaRepository;
    private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final TipoVinculoRepository tipoVinculoRepository;

    @Transactional(readOnly = true)
    public List<PropostaResponseDTO> listarPropostas(){
        return propostaRepository.findAll().stream()
                .map(propostaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PropostaResponseDTO> listarPropostasByProjeto(Long projetoId){
        List<Proposta> propostas = propostaRepository.findByProjeto_IdProjeto(projetoId);
        return propostas.stream()
                .map(propostaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PropostaResponseDTO buscarPropostaPorId(Long idProposta) {
        Proposta proposta = propostaRepository.findById(idProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));
        return propostaMapper.toDTO(proposta);
    }

    @Transactional
    public PropostaResponseDTO criarProposta(PropostaRequestDTO propostaRequestDTO, Usuario usuarioLogado) {

        Proposta proposta = propostaMapper.toEntity(propostaRequestDTO);

        Projeto projeto = projetoRepository.findById(propostaRequestDTO.projetoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
        if (projeto.getUsuarioCriador() != null && projeto.getUsuarioCriador().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Você não pode enviar proposta para o seu próprio projeto.", "PROPOSTA_PROPRIO_PROJETO");
        }
        if (propostaRequestDTO.valorProposta() != null && propostaRequestDTO.valorProposta() < 0) {
            throw new BusinessException("O valor da proposta não pode ser negativo.", "VALOR_INVALIDO");
        }
        // Uma proposta em aberto por pessoa e projeto (evita negociações duplicadas).
        boolean jaTemAberta = propostaRepository.findByProjeto_IdProjeto(projeto.getIdProjeto()).stream()
                .anyMatch(p -> p.getUsuario() != null && p.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())
                        && "PENDENTE".equals(p.getStatusProposta()));
        if (jaTemAberta) {
            throw new BusinessException("Você já tem uma proposta em negociação neste projeto.", "PROPOSTA_DUPLICADA");
        }
        proposta.setProjeto(projeto);

        proposta.setUsuario(usuarioLogado);

        Proposta salvo = propostaRepository.save(proposta);
        return propostaMapper.toDTO(salvo);
    }

    @Transactional
    public PropostaResponseDTO aceitarProposta(Long idProposta, Usuario usuarioLogado) {
        Proposta proposta = propostaRepository.findById(idProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));

        if (!"PENDENTE".equals(proposta.getStatusProposta())) {
            throw new IllegalArgumentException("Esta proposta já foi processada!");
        }

        Projeto projeto = proposta.getProjeto();
        if (projeto == null) {
            throw new BusinessException("Proposta não está vinculada a nenhum projeto.", "PROPOSTA_SEM_PROJETO");
        }

        // Somente o proprietário do projeto pode aceitar a proposta
        if (!projeto.getUsuarioCriador().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o proprietário do projeto pode aceitar esta proposta.", "NAO_E_PROPRIETARIO_PROJETO");
        }

        // Check if there's a pending contract linked to this proposal
        if (contraPropostaRepository.existsByProposta_IdPropostaAndStatus(
                idProposta, com.pitcherx.model.ContraProposta.StatusContraProposta.PENDENTE)) {
            throw new BusinessException("Há uma contraproposta aguardando resposta. Aguarde a decisão do autor antes de aceitar.", "CONTRAPROPOSTA_PENDENTE");
        }

        Contrato contrato = contratoRepository.findByPropostaIdAndStatusContrato(idProposta, "PENDENTE");
        if (contrato != null) {
            throw new IllegalArgumentException("Existe um contrato pendente para esta proposta. Por favor, aceite o contrato primeiro.");
        }

        proposta.setStatusProposta("ACEITA");

        // Criar vínculo ProjetoUsuario com tipo SOCIO
        Optional<TipoVinculo> tipoSocio = tipoVinculoRepository.findByNomeTipoVinculo("SOCIO");
        if (tipoSocio.isPresent()) {
            boolean jaVinculado = projetoUsuarioRepository.existsByUsuario_IdUsuarioAndProjeto_IdProjeto(
                    proposta.getUsuario().getIdUsuario(), projeto.getIdProjeto());
            if (!jaVinculado) {
                ProjetoUsuario projetoUsuario = new ProjetoUsuario();
                projetoUsuario.setProjeto(projeto);
                projetoUsuario.setUsuario(proposta.getUsuario());
                projetoUsuario.setTipoVinculo(tipoSocio.get());
                projetoUsuario.setAceitouTermos(true);
                projetoUsuario.setDataAceite(LocalDateTime.now());
                projetoUsuarioRepository.save(projetoUsuario);
            }
        }

        Double valorAtual = projeto.getValorArrecadado() != null ? projeto.getValorArrecadado() : 0.0;
        projeto.setValorArrecadado(valorAtual + (proposta.getValorProposta() != null ? proposta.getValorProposta() : 0.0));
        projetoRepository.save(projeto);

        Proposta salvo = propostaRepository.save(proposta);
        return propostaMapper.toDTO(salvo);
    }

    @Transactional
    public PropostaResponseDTO recusarProposta(Long idProposta, Usuario usuarioLogado) {
        Proposta proposta = propostaRepository.findById(idProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));

        if (!"PENDENTE".equals(proposta.getStatusProposta())) {
            throw new IllegalArgumentException("Esta proposta já foi processada!");
        }

        // Somente o proprietário do projeto pode recusar
        Projeto projeto = proposta.getProjeto();
        if (projeto != null && !projeto.getUsuarioCriador().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o proprietário do projeto pode recusar esta proposta.", "NAO_E_PROPRIETARIO_PROJETO");
        }

        proposta.setStatusProposta("RECUSADA");
        Proposta salvo = propostaRepository.save(proposta);
        return propostaMapper.toDTO(salvo);
    }

    @Transactional
    public PropostaResponseDTO atualizarProposta(Long idProposta, PropostaRequestDTO propostaRequestDTO, Usuario usuarioLogado) {
        Proposta proposta = propostaRepository.findById(idProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));

        // Somente o dono da proposta pode atualizar
        if (!proposta.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o dono da proposta pode atualizá-la.", "NAO_E_DONO_PROPOSTA");
        }

        // Bloquear se houver contraproposta pendente
        if (contraPropostaRepository.existsByProposta_IdPropostaAndStatus(
                idProposta, com.pitcherx.model.ContraProposta.StatusContraProposta.PENDENTE)) {
            throw new BusinessException("Não é possível editar a proposta pois há uma contraproposta pendente.", "CONTRAPROPOSTA_PENDENTE");
        }

        if (!"PENDENTE".equals(proposta.getStatusProposta())) {
            throw new BusinessException("Uma proposta já decidida não pode ser editada.", "PROPOSTA_JA_DECIDIDA");
        }
        if (proposta.getProjeto() != null && !proposta.getProjeto().getIdProjeto().equals(propostaRequestDTO.projetoId())) {
            throw new BusinessException("A proposta não pode ser movida para outro projeto.", "PROPOSTA_PROJETO_IMUTAVEL");
        }

        propostaMapper.toUpdate(propostaRequestDTO, proposta);

        Proposta salvo = propostaRepository.save(proposta);
        return propostaMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarProposta(Long idProposta, Usuario usuarioLogado) {
        Proposta proposta = propostaRepository.findById(idProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));

        // Somente o dono da proposta pode deletar
        if (!proposta.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o dono da proposta pode deletá-la.", "NAO_E_DONO_PROPOSTA");
        }
        if ("ACEITA".equals(proposta.getStatusProposta())) {
            throw new BusinessException("Uma proposta aceita não pode ser cancelada.", "PROPOSTA_ACEITA");
        }

        // Bloquear se houver contraproposta pendente
        if (contraPropostaRepository.existsByProposta_IdPropostaAndStatus(
                idProposta, com.pitcherx.model.ContraProposta.StatusContraProposta.PENDENTE)) {
            throw new BusinessException("Não é possível deletar a proposta pois há uma contraproposta pendente.", "CONTRAPROPOSTA_PENDENTE");
        }

        try {
            propostaRepository.delete(proposta);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar esta proposta, pois ela está associada a outras entidades.");
        }
    }

}
