# SGP | Business Operations

Visão integrada das demandas, capacidade e entregas da operação SGP. Aplicação executiva para Produção, Qualidade, Torque, Automação Industrial e Inovação IoT. Trabalha com demandas, fases e marcos; o detalhamento de desenvolvimento continua nas ferramentas técnicas.

## Executar

Ao abrir a aplicação, a tela de entrada demonstrativa solicita usuário e senha `SGP`. Essa camada usa apenas `sessionStorage` no navegador: serve para a apresentação inicial e não substitui autenticação real, servidor ou controle de acesso. Ao fechar a sessão do navegador, o acesso é solicitado novamente.

Abra `index.html` em um navegador moderno, mantendo as pastas ao lado do arquivo. A biblioteca de Excel está incluída: a aplicação não requer internet, npm, API, backend ou servidor de aplicação.

Para uma origem local estável e comportamento consistente de localStorage, recomenda-se servir arquivos estáticos:

```sh
cd SGP-Business-Operations
python3 -m http.server 8765
```

Abra `http://localhost:8765`. O servidor acima apenas entrega os arquivos estáticos; não armazena nem processa dados. Dados em `file://`, localhost e GitHub Pages são bases independentes. Alguns navegadores restringem armazenamento em arquivos locais; use a opção HTTP nesses casos.

A primeira execução cria dados fictícios relativos ao mês atual. O selo “Demonstração” identifica essa base. Importações removem o selo. Não há dados reais da operação.

## Usar o cockpit

- Visão Geral: demandas ativas, situação, próximas entregas, equipe, pipeline, capacidade e riscos.
- Cronograma: agrupamento por frente ou fase, escalas semana/mês/trimestre, navegação e linha Hoje. Role dentro do painel para ver todas as demandas. Cabeçalho e nomes ficam fixos no scroll.
- Demandas: busca, filtros globais, cadastro, edição e detalhes de todas as informações solicitadas.
- Capacidade: por frente principal da pessoa ou por pessoa; seleciona o intervalo pelos filtros De/Até. Sem intervalo, usa o mês atual.
- Pipeline: quantidades por fase e acesso às demandas de cada etapa.
- Pessoas: cadastro e alocações independentes. Cadastros inativos são preservados, mas não somam capacidade.
- Relatórios: capacidade e comparação entre entrega técnica e final; impressão ou PDF pelo navegador.
- Configurações: backups JSON, rollback da última importação, restauração da demonstração e limpeza confirmada.

Clique em uma demanda para consultar e editar fases, marcos e alocações. IDs de registros existentes são somente leitura para preservar referências. A exclusão de pessoas ou demandas com registros vinculados é bloqueada: remova os vínculos primeiro.

### Indicadores e regras

Demandas ativas excluem Concluído e Cancelado. “Em andamento” e “Aguardando cliente” usam o status declarado. Demandas em risco contam IDs distintos com risco declarado, bloqueio, espera do cliente/aprovação, prazo vencido ou sobrealocação no intervalo. O painel de riscos pode mostrar várias atenções por demanda e por pessoa. A severidade é explícita.

Próximas entregas conta **marcos**, não demandas distintas. A janela inicial é de 30 dias, configurável em Marcos para 15/30/60/90 dias. Marcos concluídos e demandas concluídas/canceladas não entram. Datas técnica/final e próximo marco da demanda entram quando não há marco equivalente já cadastrado com o mesmo nome e data.

Os filtros globais selecionam demandas por frente, líder, PMO, Plan, status, fase, risco e sobreposição de período. A busca também compõe o recorte. Pessoas usa frente principal/líder; os outros filtros de demandas atuam sobre a lista de alocações. O filtro Risco representa o campo declarado; atenções derivadas de capacidade e atraso aparecem no painel de riscos.

A timeline tem janela própria navegável (8 semanas, 4 meses ou 4 trimestres de calendário), mantendo o recorte global de demandas. Selecionar De posiciona a timeline no mês correspondente. Datas de fases são independentes e não são reescritas automaticamente ao editar a demanda. Use os avisos de importação para detectar fases ou marcos fora do intervalo.

### Capacidade

Capacidade disponível = soma da capacidade mensal dividida pelos dias corridos de cada mês dentro do período.

Horas alocadas no recorte = horas totais da alocação × dias de interseção / dias totais da alocação, incluindo início e fim.

Utilização = horas alocadas / capacidade disponível. A análise diária identifica sobrealocação mesmo quando a média mensal não supera 100%. Alocações simultâneas abaixo da capacidade são permitidas. Capacidade zero com horas alocadas aparece como “Sem capacidade”, com alerta.

As horas são distribuídas uniformemente por dias corridos. Feriados, férias, jornadas diferentes por dia e horas efetivamente apontadas não são modelados na V1. Percentual de alocação é informação complementar; **Horas** é a fonte do cálculo. Frente é agregada pela frente principal da pessoa, não pela frente da demanda. Filtros reduzem as horas às demandas selecionadas; no filtro Frente, pessoas de outras frentes principais não entram no agregado. Para avaliar conflitos da operação inteira, limpe os filtros.

## Excel: principal interface de dados

1. Clique em **Baixar Modelo Excel** ou abra `Modelo-SGP.xlsx` incluído.
2. Preencha as cinco abas. Preserve nomes das abas e cabeçalhos.
3. Clique em **Importar Excel**, selecione o XLSX e revise os totais/erros/avisos.
4. Erros críticos bloqueiam a importação. Avisos exigem marcar a confirmação de leitura.
5. Confirme a substituição. A base anterior fica disponível em **Configurações → Desfazer última importação** durante a sessão.
6. **Exportar Excel** salva toda a base, independentemente de filtros, no mesmo esquema reutilizável.

Abas:

| Aba | Conteúdo | Obrigatórios |
| --- | --- | --- |
| Demandas | Todos os 30 campos de cadastro, responsáveis, fases, datas, esforço, risco e link técnico | ID, Código, Nome da Demanda, Tipo, Frente, Fase Atual, Status, Data Início, Data Final Prevista |
| Pessoas | ID, Nome, Função, Frente Principal, Tech Leader, Capacidade Mensal, Ativo | Todos, exceto Tech Leader |
| Alocacoes | Pessoa ID, Demanda ID, Data Início, Data Fim, Horas, Percentual | Todos, exceto Percentual |
| Fases | Demanda ID, Fase, Data Início, Data Fim, Status | Todos |
| Marcos | Demanda ID, Marco, Data, Status, Observação | Todos, exceto Observação |
| LEIA-ME | Valores permitidos, obrigatoriedade e regras | Informativa |

Datas: prefira `AAAA-MM-DD` como texto. Células de data Excel e texto `DD/MM/AAAA` são aceitos. Os valores exportados ficam em ISO para evitar ambiguidade regional. IDs e referências são texto. Horas são números não negativos; percentuais de 0 a 100. “Ativo” aceita Sim/Não. Enumerações são exatas e estão na aba LEIA-ME.

São verificados: abas, colunas, campos obrigatórios, IDs/códigos duplicados, datas reais (incluindo fevereiro), ordem início/fim, números, enumerações e referências. Links técnicos aceitam apenas HTTP/HTTPS. Conteúdo importado é escapado antes de renderizar. Arquivos acima de 20 MB são recusados. Abas vazias são válidas com cabeçalhos.

A importação substitui o conjunto inteiro; não faz merge por ID. O rollback é em memória e se perde ao recarregar. O JSON técnico usa o mesmo validador. Exportações Excel incluem os dados, mas não as preferências da interface. JSON inclui configurações da base.

## Persistência

`localStorage['sgp-business-operations-v1']` contém entidades, versão, configurações e última atualização. `localStorage['sgp-view']` contém filtros e preferências de visualização. Não há servidor, autenticação, sincronização ou compartilhamento. Ao limpar dados, uma base vazia é salva para não recriar a demonstração no próximo acesso.

Dados corrompidos não são automaticamente substituídos. Configurações oferece exportação do conteúdo de recuperação. Falta de espaço gera mensagem e a operação de gravação é recusada. Exportações regulares são necessárias; limpar os dados do navegador remove a base. Evite editar a mesma origem simultaneamente em várias abas: não há controle de concorrência.

## Arquitetura e arquivos

- `index.html`: shell semântico e carregamento ordenado de scripts clássicos, compatível com abertura local.
- `css/styles.css`: identidade com acentos magenta T-Systems, sidebar grafite, cockpit, responsividade, impressão e foco.
- `js/utils.js`: esquema, enumerações, datas UTC e escape HTML.
- `js/data.js`: dados fictícios, base vazia e adaptador localStorage.
- `js/validation.js`: regras compartilhadas de cadastro/importação.
- `js/capacity.js`: regras proporcionais e conflitos por dia.
- `js/excel.js`: modelo, importação, exportação e backup.
- `js/timeline.js`: fases, marcos, períodos e agrupamentos.
- `js/dashboard.js`: indicadores, tabelas e painéis.
- `js/app.js`: navegação, estado, filtros, formulários e confirmação.
- `vendor/`: SheetJS CE 0.20.3 e licença Apache 2.0.
- `tests/core.cjs`: testes de regras e round-trip XLSX; gera massa de teste de volume.

O namespace SGP evita dependências de bundler e de servidor de módulos. Camadas de dados, regras e apresentação são separadas. Um futuro adaptador pode substituir localStorage/Excel por API sem reutilizar o modelo de atividades do projeto antigo. A ferramenta WebMCP somente leitura é registrada quando o navegador oferece suporte; a aplicação funciona normalmente sem ela.

## Referência técnica e decisões

`AndreFrateschi/Cronograma_V1`, `index.html`, foi consultado apenas para análise. Conceitos retidos: períodos, cabeçalhos/nomes fixos, tema por tokens, persistência e importação/exportação. Nenhum arquivo desse repositório foi alterado. A nova modelagem relaciona Demandas → Fases/Marcos/Alocações e Pessoas → Alocações.

Não são incluídos logo oficial, sprint, histórias, tarefas, bugs, apontamento de horas, workflow de aprovação ou controle financeiro. A sidebar combina o símbolo T e quadrados do arquivo oficial da T-Systems com a assinatura SGP / Business Operations, conforme solicitado. A origem está documentada em assets/README.md. O magenta (#E20074) aparece também nas ações e seleções. Isso mantém o foco em visibilidade, previsibilidade, capacidade, dependências, riscos e entregas.

## Publicar posteriormente no GitHub Pages

Este projeto é estático, usa caminhos relativos e não requer build. Crie um repositório **novo**, por exemplo `SGP-Business-Operations`, e publique o conteúdo desta pasta na raiz da branch `main`. Não use `Cronograma_V1`.

No GitHub, abra Settings → Pages → Deploy from a branch → main → /(root). Aguarde a publicação e abra a URL fornecida pelo GitHub. `.nojekyll` está incluído. Se a política da organização restringir Pages ou repositórios privados, ajuste conforme a administração da conta.

A publicação remota não foi realizada nesta entrega; a compatibilidade estática foi verificada localmente. O armazenamento de localhost não migra para Pages: exporte de uma origem e importe na outra. Os dados operacionais não são enviados ao repositório pela aplicação. Nunca inclua backups reais nos arquivos publicados.

## Testar

Com Node.js disponível:

```sh
node tests/core.cjs
```

Testes cobrem dados válidos/inválidos, datas e referências, round-trip binário XLSX, modelo, abas vazias, localStorage simulado, sobrealocação proporcional, períodos, ausência de dados, escape HTML e 500 demandas/200 pessoas/2.000 alocações/5.000 fases. `QA.md` registra a revisão no navegador e limitações de verificação.

## Evolução possível

Adaptadores de API, integração com Git/Azure DevOps, calendário de disponibilidade, operações/clientes configuráveis e persistência multiusuário podem ser adicionados futuramente. Nenhum deles faz parte da V1. Não há gestão granular de execução técnica.
