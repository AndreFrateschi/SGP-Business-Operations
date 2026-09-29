// Numbered application releases start here; stored data keeps its independent schema version.
SGP.releases=[{
 version:'1.0.0',date:'29/09/2026',title:'Primeira versão com histórico visível',
 intro:'Reúne as funcionalidades disponíveis nesta publicação. As alterações anteriores não tinham numeração de versão própria.',
 changes:[
  ['Demandas e fases','A estimativa da demanda é distribuída pelas fases que consomem horas. O detalhe mostra o saldo ainda não planejado; fases sem consumo não reduzem a estimativa.'],
  ['Pessoas e capacidade','As alocações informam horas por demanda. O percentual é calculado pelas horas alocadas sobre 8 horas por dia útil do período; sobreposição só indica sobrecarga quando excede a capacidade diária.'],
  ['Cobertura e riscos','O relatório compara esforço necessário e horas alocadas por demanda, no projeto inteiro ou em um período. Alertas incluem fases vencidas, marcos bloqueados e cobertura insuficiente.'],
  ['Cronograma executivo','Visão por frente ou por fase, com fases e marcos cadastrados, escalas de tempo, tela expandida e impressão isolada do cronograma.'],
  ['Filtros e dados','Filtros globais definem o recorte das telas e dos indicadores. A importação e exportação Excel trabalham com a base completa; os dados operacionais ficam salvos neste navegador.'],
  ['Acesso demonstrativo','O login SGP/SGP é apenas uma demonstração local; não substitui autenticação de servidor.']
 ]
}];
SGP.releasePanel=()=>`<div class="release-history"><h3>Sobre esta versão</h3><p>Versão da aplicação: <strong>${SGP.releases[0].version}</strong>. Clique em uma versão para ver as funcionalidades e regras incluídas. A versão dos dados é independente deste número.</p>${SGP.releases.map(release=>`<details class="release-entry"><summary><span><strong>Versão ${release.version}</strong> · ${release.date}</span><small>${release.title}</small></summary><div class="release-body"><p>${release.intro}</p><ul>${release.changes.map(([name,description])=>`<li><strong>${name}:</strong> ${description}</li>`).join('')}</ul><p><a href="https://github.com/AndreFrateschi/SGP-Business-Operations/tree/v${release.version}" target="_blank" rel="noopener noreferrer">Ver código desta versão no GitHub ↗</a></p></div></details>`).join('')}<p class="release-history-link">As mudanças anteriores à numeração podem ser consultadas no <a href="https://github.com/AndreFrateschi/SGP-Business-Operations/commits/main/" target="_blank" rel="noopener noreferrer">histórico de commits no GitHub ↗</a>.</p></div>`;
