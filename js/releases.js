// Application releases are independent of the version of data stored in this browser.
SGP.releases=[{
 version:'1.0.11',date:'29/09/2026',title:'Equipe e capacidade em uma área',
 intro:'O planejamento e o cadastro de recursos ficam no mesmo menu, com visões próprias para cada tarefa.',
 changes:[['Navegação','O menu Equipe e capacidade reúne as abas Ocupação, Alocações e Pessoas.'],['Filtros e cálculos','Ocupação por frente identifica que segue os filtros de demanda; por pessoa identifica que considera todas as demandas. O período continua valendo nas duas visões.']]
},{
 version:'1.0.10',date:'29/09/2026',title:'Agenda de alocação por pessoa',
 intro:'A ocupação do profissional fica visível antes de confirmar uma alocação.',
 changes:[['Alocações','O cadastro mostra uma prévia por semana, considerando todas as demandas da pessoa e avisando quando a soma ultrapassa 8 horas em um dia útil. Ao editar, substitui a alocação anterior na simulação.'],['Pessoas e capacidade','A agenda individual reúne períodos e projetos da pessoa; a capacidade por pessoa considera todas as demandas, mesmo com filtros aplicados.']]
},{
 version:'1.0.9',date:'29/09/2026',title:'Busca rápida de pessoas',
 intro:'A aba Pessoas permite localizar profissionais pelo nome enquanto se digita.',
 changes:[['Pessoas e alocações','A busca por nome filtra as pessoas e suas alocações, sem exigir acentos nem diferenciar letras maiúsculas de minúsculas.']]
},{
 version:'1.0.8',date:'29/09/2026',title:'Cobertura de horas nas datas das fases',
 intro:'Horas suficientes no total passam a ser verificadas também contra o calendário das fases.',
 changes:[['Alocações e alertas','Quando uma fase que consome horas não tem cobertura nos seus dias úteis, a aplicação mostra Alocação fora do período no sininho e no relatório de cobertura. Fases sem consumo de horas não geram esse aviso.']]
},{
 version:'1.0.7',date:'29/09/2026',title:'Indicadores mais compactos',
 intro:'Os cartões da visão geral ocupam menos altura na tela.',
 changes:[['Visão geral','Ícones, números e espaços dos cartões foram reduzidos. Em telas menores, as descrições secundárias são ocultadas para manter os rótulos legíveis.']]
},{
 version:'1.0.6',date:'29/09/2026',title:'Cartões da visão geral ajustados',
 intro:'Os rótulos dos indicadores permanecem dentro dos cartões em telas mais estreitas.',
 changes:[['Visão geral','O texto dos indicadores quebra linha conforme o espaço disponível, inclusive com o menu lateral aberto.']]
},{
 version:'1.0.5',date:'29/09/2026',title:'Status e alertas separados',
 intro:'A visão geral distingue o status informado dos alertas identificados.',
 changes:[['Visão geral','O gráfico volta a mostrar o status cadastrado da demanda. O cartão Demandas com alertas informa separadamente quantas demandas exigem atenção, como as que têm um marco bloqueado.']]
},{
 version:'1.0.4',date:'29/09/2026',title:'Risco coerente na visão geral',
 intro:'O gráfico da visão geral reflete os alertas identificados para cada demanda.',
 changes:[['Situação das demandas','Demandas com alertas, como marco bloqueado, aparecem em Com alertas / em risco no gráfico, mesmo que o status cadastrado continue Em andamento.']]
},{
 version:'1.0.3',date:'29/09/2026',title:'Data e hora nos relatórios impressos',
 intro:'As impressões identificam o momento em que foram geradas.',
 changes:[['Relatórios e cronograma','O cabeçalho da impressão ou do PDF mostra a data e a hora de geração, tanto no relatório da operação quanto no cronograma por frente ou por fase.']]
},{
 version:'1.0.2',date:'29/09/2026',title:'Dias desde a entrada no pipeline',
 intro:'O tempo na operação passa a usar a data de entrada registrada na demanda.',
 changes:[['Pipeline','Novas demandas recebem automaticamente a data de entrada do dia. Demandas antigas sem essa data mostram a opção Informar data; o indicador conta dias corridos desde a data cadastrada.']]
},{
 version:'1.0.1',date:'29/09/2026',title:'Notas de versão simplificadas',
 intro:'A área de versões mostra somente as alterações disponíveis para quem usa a aplicação.',
 changes:[['Configurações','As notas de cada versão podem ser abertas nesta tela, com a descrição das funcionalidades e regras, sem links externos.']]
},{
 version:'1.0.0',date:'29/09/2026',title:'Primeira versão com histórico visível',
 intro:'Reúne as funcionalidades disponíveis nesta publicação.',
 changes:[
  ['Demandas e fases','A estimativa da demanda é distribuída pelas fases que consomem horas. O detalhe mostra o saldo ainda não planejado; fases sem consumo não reduzem a estimativa.'],
  ['Pessoas e capacidade','As alocações informam horas por demanda. O percentual é calculado pelas horas alocadas sobre 8 horas por dia útil do período; sobreposição só indica sobrecarga quando excede a capacidade diária.'],
  ['Cobertura e riscos','O relatório compara esforço necessário e horas alocadas por demanda, no projeto inteiro ou em um período. Alertas incluem fases vencidas, marcos bloqueados e cobertura insuficiente.'],
  ['Cronograma executivo','Visão por frente ou por fase, com fases e marcos cadastrados, escalas de tempo, tela expandida e impressão isolada do cronograma.'],
  ['Filtros e dados','Filtros globais definem o recorte das telas e dos indicadores. A importação e exportação Excel trabalham com a base completa; os dados operacionais ficam salvos neste navegador.']
 ]
}];
SGP.releasePanel=()=>`<div class="release-history"><h3>Sobre esta versão</h3><p>Versão da aplicação: <strong>${SGP.releases[0].version}</strong>. Clique em uma versão para ver o que foi implementado. A versão dos dados é independente deste número.</p>${SGP.releases.map(release=>`<details class="release-entry"><summary><span><strong>Versão ${release.version}</strong> · ${release.date}</span><small>${release.title}</small></summary><div class="release-body"><p>${release.intro}</p><ul>${release.changes.map(([name,description])=>`<li><strong>${name}:</strong> ${description}</li>`).join('')}</ul></div></details>`).join('')}</div>`;
