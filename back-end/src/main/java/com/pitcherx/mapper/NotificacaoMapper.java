package com.pitcherx.mapper;

import com.pitcherx.dto.notificacao.NotificacaoResponseDTO;
import com.pitcherx.model.Notificacao;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface NotificacaoMapper {

    NotificacaoMapper INSTANCE = Mappers.getMapper(NotificacaoMapper.class);

    NotificacaoResponseDTO toDTO(Notificacao notificacao);
}