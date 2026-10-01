package com.pitcherx.repository;

import com.pitcherx.model.SubArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubAreaRepository extends JpaRepository<SubArea, Long> {

    boolean existsSubAreaByNomeSubArea(String nomeSubArea);

    boolean existsSubAreaByNomeSubAreaAndIdSubAreaNot(String nomeSubArea, Long idArea);

}
