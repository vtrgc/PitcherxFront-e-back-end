package com.pitcherx.config;

import com.pitcherx.model.*;
import com.pitcherx.repository.TipoConteudoRepository;
import com.pitcherx.security.RoleType;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.pitcherx.repository.RoleRepository;
import com.pitcherx.repository.TipoVinculoRepository;
import com.pitcherx.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
public class DataInitializer {

	private final PasswordEncoder passwordEncoder;

	public DataInitializer(PasswordEncoder passwordEncoder) {
		this.passwordEncoder = passwordEncoder;
	}

	@Bean
	CommandLineRunner inicializarDados(
			RoleRepository roleRepository,
			TipoVinculoRepository tipoVinculoRepository,
			UsuarioRepository usuarioRepository,
			TipoConteudoRepository tipoConteudoRepository) {

		return args -> {
			if (roleRepository.count() == 0) {
				for (RoleType tipo : RoleType.values()) {
					roleRepository.save(new Role(tipo));
				}
				IO.println("Roles adicionadas ao banco de dados.");
			}

			if (tipoVinculoRepository.count() == 0) {
				String[] tipoVinculos = {"CRIADOR", "SOCIO", "INVESTIDOR", "VISUALIZADOR"};
				for(String tpVinculo : tipoVinculos) {
					TipoVinculo tipoVinculo = new TipoVinculo();
					tipoVinculo.setNomeTipoVinculo(tpVinculo);
					tipoVinculoRepository.save(tipoVinculo);
				}
				IO.println("Tipos de vinculo adicionadas ao banco de dados.");
			}

			if (!usuarioRepository.existsUsuarioByEmailUsuario("adm@gmail.com")) {
				Usuario admin = new Usuario();
				admin.setNomeUsuario("admin");
				admin.setEmailUsuario("adm@gmail.com");
				String senhaHash = passwordEncoder.encode("adm1234567");
				admin.setSenhaUsuario(senhaHash);

				Role role = roleRepository.findRoleByNomeRole(RoleType.ADMIN)
						.orElseThrow(() -> new RuntimeException("Sem role com o nome informado!"));

				admin.setRoles(Set.of(role));
				usuarioRepository.save(admin);
				IO.println("Admin inicial adicionado ao banco de dados.");
			}

			if (tipoConteudoRepository.count()==0){
				for(TipoConteudoEnum tpConteudo : TipoConteudoEnum.values()) {
					TipoConteudo tipoConteudo = new TipoConteudo();
					tipoConteudo.setNomeTipoConteudo(tpConteudo);
					tipoConteudoRepository.save(tipoConteudo);
				}
				IO.println("Tipos de conteudo adicionadas ao banco de dados.");
			}
		};
	}
}