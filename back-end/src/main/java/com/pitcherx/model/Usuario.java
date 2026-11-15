package com.pitcherx.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "usuario")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "nome_usuario", nullable = false)
    private String nomeUsuario;

    @Email
    @Column(name = "email_usuario", nullable = false, unique = true)
    private String emailUsuario;

    @Column(name = "senha_usuario", nullable = false)
    private String senhaUsuario;

    @Column(name = "telefone_usuario")
    private String telefoneUsuario;

    @Column(name = "url_imagem_usuario")
    private String urlImagemUsuario;

    @Column(name = "url_video_usuario")
    private String urlVideoUsuario;

    @Column(name = "codigo_verificacao_usuario")
    private String codigoVerificacao;

    @Column(name = "verificado_usuario")
    private Boolean verificado = false;

    @Column(name = "is_active_usuario", nullable = false)
    private Boolean active = false;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_role",
            joinColumns = @JoinColumn(name = "id_usuario"),
            inverseJoinColumns = @JoinColumn(name = "id_role")
    )
    private Set<Role> roles;

    @Column(name = "data_criacao_usuario", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime dataCriacaoUsuario;

    @Column(name = "data_atualizacao_usuario", nullable = false)
    @UpdateTimestamp
    private LocalDateTime dataAtualizacaoUsuario;

    @Column(name = "url_comprovante_identidade", length = 500)
    private String urlComprovanteIdentidade;

    @Column(name = "status_analise_identidade", nullable = false, length = 30)
    private String statusAnaliseIdentidade = "PENDENTE";

    @Column(name = "tentativas_identidade", nullable = false)
    private Integer tentativasIdentidade = 0;

    @ManyToOne
    @JoinColumn(name = "nivel_conta_id")
    private NivelConta nivelConta;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjetoUsuario> projetos = new ArrayList<>();

    @OneToOne(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private PerfilUsuario perfilUsuario;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getNomeRole().name()))
                .collect(Collectors.toList());
    }

    @Override
    public @Nullable String getPassword() {
        return this.senhaUsuario;
    }

    @Override
    public String getUsername() {
        return this.emailUsuario;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return this.active != null && this.active;
    }

    public boolean isVerificado() {
        return this.verificado != null && this.verificado;
    }
}
