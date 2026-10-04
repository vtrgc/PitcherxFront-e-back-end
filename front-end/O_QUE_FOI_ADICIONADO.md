# PitcherX — O que foi adicionado (Grupo 10)

## Funcionalidades

- Busca automática de endereço pelo CEP
- Exibição da cidade pelo CEP
- Máscara de CEP (00000-000)
- LinkedIn opcional
- Quantidade de comentários nas publicações
- Quantidade de curtidas nas publicações
- Página da publicação (`/publicacao/{id}`)
- Link de compartilhamento da publicação
- Redirecionamento do link antigo `/comentarios/{id}`
- Restrição de contratos às partes do projeto
- Tela "Acesso restrito" para contratos
- Cálculo correto da porcentagem do perfil
- Denúncia de publicação
- Denúncia de comentário
- Denúncia de resposta
- Denúncia de projeto
- Modal de denúncia
- Desfazer denúncia
- Verificação da conta (e-mail, CPF/CNPJ e conta)
- Aba Empresas no Explorar
- Selo "Empresa" no perfil
- Aba "Apoiados" no perfil da empresa
- Botão "Seguindo" com opção "Parar de seguir"
- Botão Seguir/Seguindo no feed
- Meta financeira do projeto
- Valor captado do projeto
- Valor restante do projeto
- Progresso da captação
- Investimento mínimo do projeto
- Uso dos recursos do projeto
- Participação disponível (aquisição)
- Votos do projeto
- Votos de empresas e de pessoas
- Status do projeto
- Duração e prazo do projeto
- Informações principais do projeto
- Autor do projeto
- Empresas relacionadas ao projeto
- Botão Votar no projeto
- Botão Compartilhar projeto
- Campos financeiros no formulário de projeto
- Resumo financeiro nos cartões de projeto

## Páginas administrativas (Grupo 10 — melhorias no admin)

- Botão "+ Cadastrar" com modal em todas as páginas de cadastro do admin
- Botão "Editar" com modal preenchida em cada registro
- Campo "Pesquisar..." em todas as páginas administrativas
- Paginação (anterior/próxima, número da página, itens por página)
- Mensagem "Nenhum resultado encontrado" com "Limpar pesquisa"
- Filtro por área (Subáreas)
- Filtro por estado (Endereços)
- Filtro por contrato (Termos de contrato)
- Contagem de uso por registro (subáreas, perfis, projetos)
- Busca de CEP no cadastro de endereço do admin
- Cadastro de usuário pelo admin
- Edição de status e perfis do usuário em modal
- Pesquisa e paginação de todos os comentários (Interações)
- Padrão visual único das páginas administrativas

## Notificações de atividade

- Notificação de novo comentário nas suas publicações (com autor e trecho)
- Notificação de resposta aos seus comentários
- Notificação de novas curtidas nas suas publicações e comentários
- Notificação de novos votos nos seus projetos
- Aviso na tela (toast) quando chega uma notificação nova
- Contador do sino somando conexões + curtidas/comentários
- Filtros "Curtidas e comentários" e "Conexões" na página de Notificações
- Botão "Ver publicação" / "Ver projeto" em cada notificação

## Arquivos novos

- `app/lib/cep.ts`
- `app/lib/fichaProjeto.ts`
- `app/lib/projeto.ts`
- `app/lib/verificacao.ts`
- `app/hook/useConsultaCep.ts`
- `app/hook/useDenuncia.ts`
- `app/services/denuncia.service.ts`
- `app/services/empresa.service.ts`
- `app/components/perfil/StatusCep.tsx`
- `app/components/perfil/CartaoVerificacao.tsx`
- `app/components/denuncia/ModalDenuncia.tsx`
- `app/components/denuncia/ConteudoOcultado.tsx`
- `app/components/projeto/PainelFinanceiro.tsx`
- `app/components/projeto/PainelVotos.tsx`
- `app/components/projeto/ResumoFinanceiroMini.tsx`
- `app/publicacao/[id]/page.tsx`
- `tests/cep.test.ts`
- `tests/grupo10.test.ts`
- `tests/listagem.test.ts`
- `app/lib/listagem.ts`
- `app/hook/useListagemAdmin.ts`
- `app/hook/useModalCadastro.ts`
- `app/components/admin/CabecalhoAdmin.tsx`
- `app/components/admin/BarraPesquisaAdmin.tsx`
- `app/components/admin/ListaAdmin.tsx`
- `app/components/admin/ModalAdmin.tsx`
- `app/components/admin/Paginacao.tsx`
- `app/lib/atividade.ts`
- `app/services/atividade.service.ts`
- `app/components/NotificacaoAtividadeCard.tsx`
- `tests/atividade.test.ts`
- `RELATORIO_GRUPO10.md`
