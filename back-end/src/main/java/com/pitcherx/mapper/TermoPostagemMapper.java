package com.pitcherx.mapper;

import com.pitcherx.dto.termoPostagem.TermoPostagemRequestDTO;
import com.pitcherx.dto.termoPostagem.TermoPostagemResponseDTO;
import com.pitcherx.model.TermoPostagem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TermoPostagemMapper {

    TermoPostagemResponseDTO toDTO(TermoPostagem termoPostagem);

    @Mapping(target = "idTermoPostagem", ignore = true)
    TermoPostagem toEntity(TermoPostagemRequestDTO termoPostagemRequestDTO);

    void updateFromDTO(TermoPostagemRequestDTO termoPostagemRequestDTO, @MappingTarget TermoPostagem termoPostagem);

}
