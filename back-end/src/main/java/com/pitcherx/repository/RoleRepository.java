package com.pitcherx.repository;

import java.util.Optional;

import com.pitcherx.security.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long>{
	
	Optional<Role> findRoleByNomeRole(RoleType nomeRole);

}
