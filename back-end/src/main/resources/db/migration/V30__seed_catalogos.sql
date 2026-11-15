DO $$
BEGIN
    IF to_regclass('public.sub_area') IS NULL AND to_regclass('public.subarea') IS NOT NULL THEN
        ALTER TABLE subarea RENAME TO sub_area;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sub_area'
          AND column_name = 'area_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sub_area'
          AND column_name = 'id_area'
    ) THEN
        ALTER TABLE sub_area RENAME COLUMN area_id TO id_area;
    END IF;

    IF to_regclass('public.sub_area') IS NOT NULL
       AND to_regclass('public.subarea') IS NOT NULL THEN
        INSERT INTO sub_area (nome_sub_area, descricao_sub_area, id_area)
        SELECT legado.nome_sub_area, legado.descricao_sub_area, legado.area_id
        FROM subarea legado
        WHERE NOT EXISTS (
            SELECT 1
            FROM sub_area atual
            WHERE atual.nome_sub_area = legado.nome_sub_area
        );
    END IF;

    IF to_regclass('public.sub_area') IS NOT NULL THEN
        ALTER TABLE sub_area ALTER COLUMN id_area DROP DEFAULT;
    END IF;
END;
$$;

INSERT INTO especialidade (nome_especialidade)
SELECT seed.nome_especialidade
FROM (VALUES
    ('Desenvolvimento de Software'),
    ('Engenharia de Dados'),
    ('Inteligência Artificial'),
    ('Cibersegurança'),
    ('Computação em Nuvem'),
    ('Design de Produto'),
    ('Experiência do Usuário'),
    ('Gestão de Projetos'),
    ('Empreendedorismo'),
    ('Marketing Digital'),
    ('Finanças'),
    ('Direito Empresarial'),
    ('Biotecnologia'),
    ('Agronomia'),
    ('Engenharia Ambiental'),
    ('Energias Renováveis'),
    ('Saúde Pública'),
    ('Educação'),
    ('Análise de Dados'),
    ('Internet das Coisas'),
    ('Robótica'),
    ('Telecomunicações'),
    ('Arquitetura e Urbanismo'),
    ('Logística'),
    ('Comércio Exterior'),
    ('Recursos Humanos'),
    ('Comunicação'),
    ('Ciência de Materiais'),
    ('Economia'),
    ('Sustentabilidade')
) AS seed(nome_especialidade)
WHERE NOT EXISTS (
    SELECT 1
    FROM especialidade existente
    WHERE existente.nome_especialidade = seed.nome_especialidade
);

INSERT INTO area (nome_area, descricao_area)
SELECT seed.nome_area, seed.descricao_area
FROM (VALUES
    ('Ciência da Computação', 'Estudo de fundamentos, métodos e tecnologias para computação e sistemas digitais.'),
    ('Engenharias', 'Criação, análise e operação de sistemas, produtos e infraestruturas de engenharia.'),
    ('Saúde', 'Promoção da saúde, prevenção de doenças, diagnóstico e cuidado de pessoas e comunidades.'),
    ('Ciências Biológicas', 'Estudo dos seres vivos, de sua organização e de suas relações com o ambiente.'),
    ('Ciências Agrárias', 'Conhecimento aplicado à produção agropecuária, florestal e ao desenvolvimento rural.'),
    ('Ciências Exatas', 'Investigação quantitativa de fenômenos por meio de modelos matemáticos e experimentais.'),
    ('Ciências Humanas', 'Estudo das pessoas, culturas, sociedades, história e processos de aprendizagem.'),
    ('Ciências Sociais Aplicadas', 'Aplicação do conhecimento social à gestão, economia, direito e políticas públicas.'),
    ('Linguística e Letras', 'Estudo das línguas, da linguagem, da literatura e de suas manifestações.'),
    ('Artes', 'Criação, pesquisa e difusão de práticas e expressões artísticas.'),
    ('Educação', 'Pesquisa e desenvolvimento de práticas, recursos e políticas para ensino e aprendizagem.'),
    ('Comunicação', 'Produção, circulação e análise de informação, conteúdo e mídia.'),
    ('Arquitetura e Urbanismo', 'Planejamento de edificações, espaços públicos e ambientes urbanos.'),
    ('Administração', 'Gestão de organizações, processos, pessoas e estratégias.'),
    ('Economia', 'Análise da produção, distribuição e consumo de bens e serviços.'),
    ('Direito', 'Estudo das normas, instituições, direitos e mecanismos de justiça.'),
    ('Meio Ambiente', 'Conservação ambiental, gestão de recursos naturais e desenvolvimento sustentável.'),
    ('Energia', 'Geração, armazenamento, distribuição e uso eficiente de energia.'),
    ('Design', 'Concepção de produtos, serviços e experiências centrados nas necessidades das pessoas.'),
    ('Logística e Transporte', 'Planejamento de cadeias de suprimentos, mobilidade e operações de transporte.')
) AS seed(nome_area, descricao_area)
WHERE NOT EXISTS (
    SELECT 1
    FROM area existente
    WHERE existente.nome_area = seed.nome_area
);

INSERT INTO sub_area (nome_sub_area, descricao_sub_area, id_area)
SELECT dados.nome_sub_area, dados.descricao_sub_area, area.id_area
FROM (VALUES
    ('Engenharia de Software', 'Métodos e ferramentas para especificar, desenvolver e manter software.', 'Ciência da Computação'),
    ('Inteligência Artificial', 'Sistemas capazes de aprender, inferir e apoiar decisões.', 'Ciência da Computação'),
    ('Banco de Dados', 'Modelagem, armazenamento, consulta e governança de dados.', 'Ciência da Computação'),
    ('Redes e Segurança', 'Comunicação entre sistemas, proteção de ativos e resposta a incidentes.', 'Ciência da Computação'),
    ('Engenharia Civil', 'Projeto e construção de edificações e infraestrutura.', 'Engenharias'),
    ('Engenharia Elétrica', 'Sistemas elétricos, eletrônicos, controle e automação.', 'Engenharias'),
    ('Engenharia Mecânica', 'Projeto, fabricação e manutenção de máquinas e sistemas mecânicos.', 'Engenharias'),
    ('Engenharia de Produção', 'Otimização de processos, operações e sistemas produtivos.', 'Engenharias'),
    ('Medicina', 'Prevenção, diagnóstico e tratamento de condições de saúde.', 'Saúde'),
    ('Enfermagem', 'Cuidado integral e promoção da saúde de indivíduos e comunidades.', 'Saúde'),
    ('Saúde Coletiva', 'Políticas, serviços e ações de saúde para populações.', 'Saúde'),
    ('Fisioterapia', 'Prevenção e reabilitação do movimento e da funcionalidade.', 'Saúde'),
    ('Biologia Molecular', 'Processos biológicos em nível molecular e celular.', 'Ciências Biológicas'),
    ('Ecologia', 'Relações entre organismos e os ambientes em que vivem.', 'Ciências Biológicas'),
    ('Microbiologia', 'Estudo de microrganismos e suas aplicações.', 'Ciências Biológicas'),
    ('Genética', 'Hereditariedade, variação genética e suas aplicações.', 'Ciências Biológicas'),
    ('Agronomia', 'Manejo de culturas, solos e sistemas de produção agrícola.', 'Ciências Agrárias'),
    ('Zootecnia', 'Produção e bem-estar animal com eficiência e responsabilidade.', 'Ciências Agrárias'),
    ('Engenharia Florestal', 'Manejo, conservação e recuperação de recursos florestais.', 'Ciências Agrárias'),
    ('Ciência dos Alimentos', 'Qualidade, segurança, processamento e conservação de alimentos.', 'Ciências Agrárias'),
    ('Matemática Aplicada', 'Modelagem matemática de problemas científicos e tecnológicos.', 'Ciências Exatas'),
    ('Estatística', 'Coleta, análise e interpretação de dados sob incerteza.', 'Ciências Exatas'),
    ('Física', 'Investigação das leis fundamentais da matéria e da energia.', 'Ciências Exatas'),
    ('Química', 'Estudo da composição, propriedades e transformação da matéria.', 'Ciências Exatas'),
    ('Psicologia', 'Estudo dos processos mentais, comportamento e saúde psicológica.', 'Ciências Humanas'),
    ('Sociologia', 'Análise das relações, instituições e transformações sociais.', 'Ciências Humanas'),
    ('História', 'Pesquisa e interpretação de sociedades e acontecimentos ao longo do tempo.', 'Ciências Humanas'),
    ('Filosofia', 'Investigação crítica de conceitos, conhecimento, ética e realidade.', 'Ciências Humanas'),
    ('Administração Pública', 'Gestão de serviços, organizações e políticas do setor público.', 'Ciências Sociais Aplicadas'),
    ('Contabilidade', 'Registro, análise e comunicação de informações financeiras.', 'Ciências Sociais Aplicadas'),
    ('Serviço Social', 'Promoção de direitos e enfrentamento de desigualdades sociais.', 'Ciências Sociais Aplicadas'),
    ('Relações Internacionais', 'Estudo das relações políticas, econômicas e culturais entre países.', 'Ciências Sociais Aplicadas'),
    ('Linguística Aplicada', 'Estudo da linguagem em contextos de ensino e uso social.', 'Linguística e Letras'),
    ('Língua Portuguesa', 'Pesquisa sobre língua portuguesa, variação, ensino e uso.', 'Linguística e Letras'),
    ('Literatura Brasileira', 'Estudo de obras, autores e movimentos literários brasileiros.', 'Linguística e Letras'),
    ('Tradução', 'Práticas e tecnologias de tradução entre línguas e culturas.', 'Linguística e Letras'),
    ('Artes Visuais', 'Criação e pesquisa em desenho, pintura, fotografia e mídias visuais.', 'Artes'),
    ('Música', 'Composição, interpretação, produção e pesquisa musical.', 'Artes'),
    ('Teatro', 'Criação, produção e pesquisa de práticas cênicas.', 'Artes'),
    ('Audiovisual', 'Produção e análise de obras para cinema, televisão e plataformas digitais.', 'Artes'),
    ('Tecnologia Educacional', 'Uso de recursos digitais para apoiar ensino e aprendizagem.', 'Educação'),
    ('Formação de Professores', 'Desenvolvimento de conhecimentos e práticas docentes.', 'Educação'),
    ('Educação Inclusiva', 'Práticas e recursos para garantir participação e aprendizagem de todos.', 'Educação'),
    ('Avaliação da Aprendizagem', 'Métodos para acompanhar e aprimorar resultados educacionais.', 'Educação'),
    ('Jornalismo', 'Apuração, produção e distribuição de informação de interesse público.', 'Comunicação'),
    ('Publicidade e Propaganda', 'Estratégias criativas e comunicação de marcas e iniciativas.', 'Comunicação'),
    ('Comunicação Digital', 'Plataformas, comunidades e formatos de comunicação em rede.', 'Comunicação'),
    ('Relações Públicas', 'Gestão do relacionamento e da reputação de organizações.', 'Comunicação'),
    ('Arquitetura', 'Concepção e planejamento de edifícios e espaços construídos.', 'Arquitetura e Urbanismo'),
    ('Urbanismo', 'Planejamento e desenvolvimento de cidades e territórios.', 'Arquitetura e Urbanismo'),
    ('Paisagismo', 'Planejamento de espaços abertos e integração com a paisagem.', 'Arquitetura e Urbanismo'),
    ('Habitação Social', 'Soluções habitacionais acessíveis e adequadas às comunidades.', 'Arquitetura e Urbanismo'),
    ('Empreendedorismo', 'Identificação e desenvolvimento de oportunidades e novos negócios.', 'Administração'),
    ('Gestão de Pessoas', 'Desenvolvimento de equipes, competências e relações de trabalho.', 'Administração'),
    ('Gestão da Inovação', 'Processos para transformar conhecimento em inovação e valor.', 'Administração'),
    ('Estratégia Organizacional', 'Definição e execução de objetivos e posicionamento organizacional.', 'Administração'),
    ('Economia Comportamental', 'Estudo de como fatores psicológicos influenciam decisões econômicas.', 'Economia'),
    ('Economia do Desenvolvimento', 'Análise de crescimento, renda e bem-estar de sociedades.', 'Economia'),
    ('Finanças', 'Decisões de investimento, financiamento e gestão de recursos.', 'Economia'),
    ('Economia Digital', 'Análise de mercados e atividades econômicas baseadas em tecnologias digitais.', 'Economia'),
    ('Direito Civil', 'Relações jurídicas entre pessoas, organizações e patrimônio.', 'Direito'),
    ('Direito Digital', 'Direitos e responsabilidades em ambientes e serviços digitais.', 'Direito'),
    ('Direito Ambiental', 'Normas e instrumentos para proteção e uso sustentável do ambiente.', 'Direito'),
    ('Direito do Trabalho', 'Relações de trabalho, direitos e deveres de trabalhadores e empregadores.', 'Direito'),
    ('Conservação da Biodiversidade', 'Proteção de espécies, habitats e diversidade genética.', 'Meio Ambiente'),
    ('Gestão de Recursos Hídricos', 'Planejamento e uso sustentável de águas superficiais e subterrâneas.', 'Meio Ambiente'),
    ('Mudanças Climáticas', 'Mitigação e adaptação aos efeitos das mudanças do clima.', 'Meio Ambiente'),
    ('Gestão de Resíduos', 'Redução, reaproveitamento, tratamento e destinação de resíduos.', 'Meio Ambiente'),
    ('Energia Solar', 'Conversão da radiação solar em energia térmica ou elétrica.', 'Energia'),
    ('Energia Eólica', 'Geração de energia a partir dos ventos e integração à rede.', 'Energia'),
    ('Biocombustíveis', 'Produção e uso de combustíveis provenientes de biomassa.', 'Energia'),
    ('Eficiência Energética', 'Redução do consumo de energia mantendo a qualidade dos serviços.', 'Energia'),
    ('Design de Interação', 'Projeto de interações claras, acessíveis e úteis entre pessoas e sistemas.', 'Design'),
    ('Design Gráfico', 'Comunicação visual por meio de tipografia, imagem e composição.', 'Design'),
    ('Design de Serviços', 'Planejamento de serviços e jornadas integradas para usuários.', 'Design'),
    ('Design de Produto', 'Concepção e desenvolvimento de produtos físicos e digitais.', 'Design'),
    ('Gestão da Cadeia de Suprimentos', 'Coordenação do fluxo de materiais, informação e produtos.', 'Logística e Transporte'),
    ('Mobilidade Urbana', 'Planejamento de deslocamentos acessíveis, seguros e sustentáveis.', 'Logística e Transporte'),
    ('Transporte de Cargas', 'Planejamento e operação do transporte de mercadorias.', 'Logística e Transporte'),
    ('Logística Reversa', 'Retorno de produtos e materiais para reaproveitamento ou destinação adequada.', 'Logística e Transporte')
) AS dados(nome_sub_area, descricao_sub_area, nome_area)
JOIN area ON area.nome_area = dados.nome_area
WHERE NOT EXISTS (
    SELECT 1
    FROM sub_area existente
    WHERE existente.nome_sub_area = dados.nome_sub_area
);

INSERT INTO tipo_projeto (nome_tipo_projeto, descricao_tipo_projeto)
SELECT seed.nome_tipo_projeto, seed.descricao_tipo_projeto
FROM (VALUES
    ('Pesquisa Científica', 'Investigação sistemática para produzir ou ampliar conhecimento científico.'),
    ('Pesquisa Aplicada', 'Pesquisa voltada à solução de problemas práticos e necessidades concretas.'),
    ('Desenvolvimento de Software', 'Criação ou evolução de aplicações, plataformas e sistemas digitais.'),
    ('Produto Digital', 'Concepção e validação de um produto baseado em tecnologia digital.'),
    ('Inteligência Artificial', 'Projeto que desenvolve ou aplica técnicas de inteligência artificial.'),
    ('Ciência de Dados', 'Projeto de coleta, processamento e análise de dados para gerar conhecimento.'),
    ('Empreendimento', 'Criação ou expansão de um negócio ou iniciativa empreendedora.'),
    ('Impacto Social', 'Iniciativa para enfrentar desafios sociais e ampliar o bem-estar coletivo.'),
    ('Sustentabilidade', 'Projeto para reduzir impactos ambientais e promover práticas sustentáveis.'),
    ('Educação', 'Desenvolvimento de soluções, conteúdos ou práticas para ensino e aprendizagem.'),
    ('Saúde', 'Iniciativa de pesquisa, serviço ou tecnologia voltada à saúde.'),
    ('Agricultura', 'Projeto de inovação, produção ou sustentabilidade em sistemas agropecuários.'),
    ('Energia Renovável', 'Desenvolvimento de soluções de geração ou uso de energia renovável.'),
    ('Inovação em Processos', 'Melhoria de processos, operações ou modelos de prestação de serviços.'),
    ('Pesquisa de Mercado', 'Estudo de clientes, concorrentes e oportunidades de mercado.'),
    ('Projeto de Design', 'Concepção e validação de produtos, serviços ou experiências.'),
    ('Infraestrutura', 'Planejamento, construção ou modernização de infraestrutura.'),
    ('Cultura e Artes', 'Produção, preservação ou difusão de iniciativas culturais e artísticas.'),
    ('Política Pública', 'Desenho, implementação ou avaliação de ações e serviços públicos.'),
    ('Projeto Comunitário', 'Iniciativa colaborativa desenvolvida com participação de uma comunidade.')
) AS seed(nome_tipo_projeto, descricao_tipo_projeto)
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_projeto existente
    WHERE existente.nome_tipo_projeto = seed.nome_tipo_projeto
);

INSERT INTO termo_postagem (titulo_termo_postagem, descricao_termo_postagem)
SELECT seed.titulo_termo_postagem, seed.descricao_termo_postagem
FROM (VALUES
    ('Respeito e convivência', 'Mantenha comunicação respeitosa. Não publique ataques, assédio, ameaças ou discriminação.'),
    ('Conteúdo relacionado a projetos', 'As publicações devem contribuir para a apresentação, discussão ou divulgação de projetos.'),
    ('Autoria e propriedade intelectual', 'Publique somente materiais próprios ou materiais cujo uso você esteja autorizado a compartilhar.'),
    ('Proteção de dados pessoais', 'Não divulgue dados pessoais seus ou de terceiros sem uma base legal e autorização apropriadas.'),
    ('Conteúdo verdadeiro e verificável', 'Apresente informações de forma honesta e indique fontes quando fizer afirmações factuais relevantes.'),
    ('Proibição de spam', 'Evite mensagens repetitivas, publicidade não solicitada e práticas destinadas a manipular interações.'),
    ('Transparência em parcerias', 'Informe vínculos, patrocínios ou interesses que possam influenciar o conteúdo publicado.'),
    ('Uso responsável de imagens', 'Respeite direitos de imagem, consentimento das pessoas retratadas e licenças aplicáveis.'),
    ('Acessibilidade das publicações', 'Sempre que possível, forneça descrições de imagens e organize o conteúdo para facilitar a compreensão.'),
    ('Proibição de conteúdo ilegal', 'Não publique conteúdo que promova atividades ilícitas ou viole direitos de terceiros.'),
    ('Segurança da comunidade', 'Não compartilhe instruções, arquivos ou links destinados a comprometer sistemas ou usuários.'),
    ('Comunicação construtiva', 'Apresente críticas de forma objetiva e focada em ideias, evidências e soluções.'),
    ('Atualização de informações', 'Mantenha atualizadas as informações sobre o projeto e corrija erros identificados.'),
    ('Uso adequado da plataforma', 'Não tente contornar controles, interromper serviços ou acessar contas e dados sem autorização.'),
    ('Conteúdo sensível', 'Avise sobre temas sensíveis e evite expor pessoas a conteúdo gráfico ou ofensivo sem necessidade.'),
    ('Respeito a licenças', 'Observe os termos de licenças de software, dados, textos, imagens e outros materiais utilizados.'),
    ('Integridade acadêmica', 'Não apresente como próprio o trabalho de outras pessoas e sinalize contribuições e referências.'),
    ('Divulgação de resultados', 'Diferencie resultados comprovados, hipóteses, estimativas e planos futuros.'),
    ('Moderação e denúncias', 'Use os mecanismos de denúncia de boa-fé e coopere com medidas de moderação da comunidade.'),
    ('Uso de conteúdo automatizado', 'Revise conteúdos gerados automaticamente e responda por sua precisão, segurança e conformidade.')
) AS seed(titulo_termo_postagem, descricao_termo_postagem)
WHERE NOT EXISTS (
    SELECT 1
    FROM termo_postagem existente
    WHERE existente.titulo_termo_postagem = seed.titulo_termo_postagem
);

INSERT INTO risco_projeto (nome_risco, descricao_risco)
SELECT seed.nome_risco, seed.descricao_risco
FROM (VALUES
    ('Atraso no cronograma', 'Atividades podem levar mais tempo que o previsto e comprometer marcos e entregas.'),
    ('Estouro de orçamento', 'Custos reais podem superar as estimativas e os recursos financeiros disponíveis.'),
    ('Falta de financiamento', 'Recursos planejados podem não ser obtidos ou podem ser interrompidos.'),
    ('Indisponibilidade de equipe', 'A saída ou indisponibilidade de pessoas-chave pode reduzir a capacidade de execução.'),
    ('Escassez de competências', 'A equipe pode não dispor de todas as habilidades técnicas ou de gestão necessárias.'),
    ('Mudança de escopo', 'Novas solicitações ou requisitos podem ampliar o projeto sem ajuste de prazo e recursos.'),
    ('Requisitos incompletos', 'Necessidades mal compreendidas podem resultar em entregas inadequadas ou retrabalho.'),
    ('Falha tecnológica', 'Limitações, defeitos ou obsolescência tecnológica podem impedir o funcionamento esperado.'),
    ('Integração com sistemas', 'Sistemas externos ou legados podem não se integrar de forma confiável.'),
    ('Perda ou corrupção de dados', 'Falhas operacionais ou técnicas podem causar perda, alteração ou indisponibilidade de dados.'),
    ('Incidente de segurança', 'Acesso indevido, vulnerabilidades ou ataques podem afetar sistemas, dados e usuários.'),
    ('Violação de privacidade', 'O tratamento de dados pessoais pode não atender aos requisitos legais ou às expectativas dos titulares.'),
    ('Dependência de fornecedor', 'Atrasos, mudanças de preço ou interrupções de fornecedores podem afetar as entregas.'),
    ('Baixa adesão de usuários', 'Público-alvo pode não adotar a solução ou participar como esperado.'),
    ('Risco regulatório', 'Mudanças legais ou interpretação de requisitos podem exigir alterações no projeto.'),
    ('Questão de propriedade intelectual', 'Licenças ou direitos de terceiros podem limitar o uso de materiais e tecnologias.'),
    ('Impacto ambiental adverso', 'Atividades do projeto podem gerar impactos ambientais não previstos ou não mitigados.'),
    ('Dependência de infraestrutura', 'Falhas em conectividade, energia ou infraestrutura podem interromper atividades.'),
    ('Problema de qualidade', 'Entregas podem não atender aos critérios de qualidade, desempenho ou confiabilidade.'),
    ('Comunicação ineficaz', 'Falhas de comunicação entre participantes podem causar desalinhamento e retrabalho.'),
    ('Conflito entre participantes', 'Divergências sobre responsabilidades, prioridades ou decisões podem atrasar o projeto.'),
    ('Premissas incorretas', 'O planejamento pode depender de condições que não se confirmem durante a execução.'),
    ('Mudança de mercado', 'Mudanças na demanda, concorrência ou contexto econômico podem reduzir a viabilidade.'),
    ('Dificuldade de manutenção', 'A solução pode ser difícil ou custosa de operar, atualizar e manter após a entrega.'),
    ('Resultados não reproduzíveis', 'Métodos ou dados insuficientemente documentados podem impedir a validação dos resultados.')
) AS seed(nome_risco, descricao_risco)
WHERE NOT EXISTS (
    SELECT 1
    FROM risco_projeto existente
    WHERE existente.nome_risco = seed.nome_risco
);
