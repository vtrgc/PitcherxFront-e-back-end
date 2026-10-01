package com.pitcherx.security;

import com.pitcherx.repository.ProjetoRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("pitcherxSecurity")
public class PitcherxSecurity {

    private final ProjetoRepository projetoRepository;

    public PitcherxSecurity(ProjetoRepository projetoRepository) {
        this.projetoRepository = projetoRepository;
    }

    /*
    public boolean isProjetoOwner(Authentication authentication, Long idUsuario) {
        String emailUsuario = authentication.getName();
        return projetoRepository.existsProjetoByIdProjetoAndUsuarioByEmailUsuario(idUsuario, emailUsuario);
    }
*/

}
