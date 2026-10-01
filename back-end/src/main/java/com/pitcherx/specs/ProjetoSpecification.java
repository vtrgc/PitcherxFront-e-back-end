package com.pitcherx.specs;

import com.pitcherx.model.Projeto;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class ProjetoSpecification {

    private ProjetoSpecification() {
    }

    public static Specification<Projeto> comNome(String nomeProjeto) {
        return(root, query, cb) ->
                nomeProjeto == null ? null : cb.like(cb.lower(root.get("nomeProjeto")), "%" + nomeProjeto.toLowerCase() + "%");
    }

    public static Specification<Projeto> comDescricao(String descricaoProjeto) {
        return (root, query, cb) ->
                descricaoProjeto == null ? null :
                        cb.like(cb.lower(root.get("descricaoProjeto")), "%" + descricaoProjeto.toLowerCase() + "%");
    }

    public static Specification<Projeto> comDataInicioApartirDe(LocalDate data) {
        return (root, query, cb) ->
                data == null ? null :
                        cb.greaterThanOrEqualTo(root.get("dataInicioProjeto"), data);
    }

    public static Specification<Projeto> comDataInicioEntre(LocalDate inicio, LocalDate fim) {
        return (root, query, cb) ->
                (inicio == null || fim == null) ? null :
                        cb.between(root.get("dataInicioProjeto"), inicio, fim);
    }

}
