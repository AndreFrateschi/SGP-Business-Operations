# Verificação da V1

Executada em 25/09/2026, com dados fictícios.

## Testes automatizados

`node tests/core.cjs`: 15 testes aprovados.

- Dados de demonstração válidos.
- Datas impossíveis, sequência invertida, negativos e percentuais fora do intervalo.
- IDs duplicados e referências inexistentes em alocações, fases e marcos.
- Workbook XLSX binário com todas as abas: gravação → leitura → comparação de todos os campos.
- Aba/coluna ausente bloqueada; datas seriais e abas vazias aceitas.
- Persistência e leitura do adaptador localStorage simulado.
- Capacidade parcial de mês, sobrealocação diária e intervalos sem interseção.
- Timeline semanal/mensal/trimestral e ausência de dados.
- Escape de HTML.
- 500 demandas, 200 pessoas, 2.000 alocações e 5.000 fases: validação, capacidade e geração do HTML em aproximadamente 72 ms nesta máquina. Esse tempo não inclui pintura do navegador e não é garantia de desempenho em outros dispositivos.

## Navegador

- Cockpit e detalhe de demanda renderizados; entrega técnica e final exibidas separadamente.
- Filtro Produção: 3 demandas, 4 pessoas e 84% de utilização; filtro aplicado e removido.
- Busca P002: uma demanda correspondente.
- Cadastro temporário criado e encontrado após reload.
- XLSX do modelo importado: 15 demandas, 22 pessoas, 66 alocações, 90 fases, 45 marcos; zero erros/avisos.
- Confirmação de importação e rollback executados.
- JSON com data impossível e pessoa inexistente: dois erros, confirmação bloqueada, base preservada.
- Massa com 500 demandas importada com confirmação explícita dos avisos; 506 linhas de timeline renderizadas; escalas Semana e Trimestre acessíveis.
- Dados de demonstração restaurados após os testes.
- Botões de modelo e exportação executados, com confirmação visual da aplicação. O evento automatizado de download do navegador incorporado não foi emitido dentro do prazo; a chegada desses downloads à pasta do sistema não foi confirmada. A geração e leitura dos arquivos XLSX foi verificada independentemente e `Modelo-SGP.xlsx` está incluído na entrega.
- Layout desktop e tablet revisado. Em 768 px, largura da página igual à viewport; scroll horizontal confinado ao cronograma/tabelas.
- Ferramenta WebMCP de consulta registrada; leitura válida retornou dados e entrada desconhecida foi recusada sem mutação.

Houve uma falha transitória de carregamento de script durante recarga na sessão de desenvolvimento. Uma nova recarga carregou normalmente; scripts finais usam `defer` mantendo a ordem. Nas verificações seguintes não foram observados novos erros da aplicação. O console conserva o registro histórico dessa falha e do teste intencional de entrada inválida.

## Limites da verificação

GitHub Pages não foi publicado nesta entrega. Caminhos relativos e funcionamento por servidor estático foram verificados localmente; a verificação na URL remota depende da publicação posterior. O repositório Cronograma_V1 não recebeu alterações.

A V1 não inclui calendário de férias/feriados para capacidade, concorrência entre abas, sincronização, autenticação ou backend. Essas limitações são descritas no README.

## Revisão de Business Operations

O cockpit responde às perguntas de volume, entregas, prazos, esperas, capacidade e risco com dados calculados. O detalhe distingue explicitamente entrega técnica de entrega final. Pipeline permite localizar gargalos por quantidade e lista tempo desde entrada. A capacidade identifica pessoas acima do limite no intervalo, inclusive conflitos diários.

A aplicação mantém somente dois níveis: demanda e fases/marcos. Não foram adicionadas tarefas técnicas, sprint, workflow de aprovação, chat ou controle financeiro. IDs e estrutura completa ficam nos cadastros/Excel; a leitura executiva permanece concentrada na Home.
