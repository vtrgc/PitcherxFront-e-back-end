package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.SubComentario;

@Repository
public interface SubComentarioRepository extends JpaRepository<SubComentario, Long>{

}
