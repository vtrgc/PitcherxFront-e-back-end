package com.pitcherx.repository;

import com.pitcherx.model.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {

    boolean existsByNomeAreaAndIdAreaNot(String nomeArea, Long idArea);

    boolean existsByNomeArea(String nomeArea);

}
