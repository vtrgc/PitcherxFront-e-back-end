# PitcherX - Backend

## Tecnologias Utilizadas

Este projeto utiliza as seguintes tecnologias e frameworks:

### Backend
- **Java 25** - Linguagem de programação principal
- **Spring Boot 4.0.5** - Framework para desenvolvimento de aplicações Java
- **Spring Data JPA** - Abstração para acesso a dados com JPA/Hibernate
- **PostgreSQL** - Banco de dados relacional
- **Flyway** - Controle de versão e migração do banco de dados
- **Spring Validation** - Validação de dados de entrada
- **Spring Mail** - Envio de emails
- **Lombok** - Redução de código boilerplate
- **MapStruct** - Mapeamento automático entre DTOs e entidades (mappers)
- **SpringDoc OpenAPI** - Documentação da API com Swagger UI

### Infraestrutura
- **Docker & Docker Compose** - Containerização e orquestração
- **Maven** - Gerenciamento de dependências e build

## Arquitetura

### Padrão Arquitetural
- **REST API** seguindo os **níveis de maturidade de Richardson**:
  - **Nível 0**: Uso de HTTP como transporte
  - **Nível 1**: Recursos identificados por URI
  - **Nível 2**: Uso correto dos verbos HTTP (GET, POST, PUT, DELETE)
  - **Nível 3**: HATEOAS (Hypermedia As The Engine Of Application State)

### Estrutura do Projeto
- **Controller**: Camada de apresentação e exposição da API REST
- **Service**: Camada de lógica de negócio
- **Repository**: Camada de acesso a dados
- **DTO**: Objetos de transferência de dados (Data Transfer Objects)
- **Mapper**: Mapeadores (MapStruct) para conversão entre DTOs e entidades
- **Model**: Entidades JPA
- **Config**: Configurações da aplicação

### Padrão de Mapeamento (MapStruct)
O projeto utiliza **MapStruct** para realizar o mapeamento automático entre DTOs e entidades:
- **toDTO()**: Converte uma entidade para DTO de resposta
- **toEntity()**: Converte um DTO de requisição para entidade
- **updateFromDTO()**: Atualiza uma entidade existente com dados de um DTO

## Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Maven 3.6+ (para build local)

### Executando com Docker Compose

1. **Clone o repositório e navegue até a pasta do backend:**
   ```bash
   cd PitcherX/BackEnd/pitcherx
   ```

2. **Execute o build do projeto:**
   ```bash
   mvn clean package -DskipTests
   ```

3. **Inicie os serviços com Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **A aplicação estará disponível em:**
   - **API REST**: http://localhost:8080
   - **Documentação Swagger**: http://localhost:8080/swagger-ui/index.html

### Serviços no Docker Compose
- **Aplicação Spring Boot**: Porta 8080
- **Banco PostgreSQL**: Porta 5433 (internamente 5432)

### Parando os serviços
```bash
docker-compose down
```

### Executando Localmente (sem Docker)

1. **Certifique-se que o PostgreSQL está rodando localmente na porta 5432**

2. **Execute a aplicação:**
   ```bash
   mvn spring-boot:run
   ```

3. **Acesse a documentação em:** http://localhost:8080/swagger-ui/index.html