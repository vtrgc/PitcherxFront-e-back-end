package com.pitcherx.model;

import com.pitcherx.security.RoleType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "role")
public class Role {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_role")
	private Long idRole;

	@Enumerated(EnumType.STRING)
	@Column(name = "nome_role", nullable = false, unique = true)
	private RoleType nomeRole;

	public Role(RoleType nomeRole) {
		this.nomeRole = nomeRole;
	}

}
