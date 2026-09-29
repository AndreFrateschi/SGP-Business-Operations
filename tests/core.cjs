const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');global.window=global;global.XLSX=require('../vendor/xlsx.full.min.js');const store=new Map();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
['utils','data','validation','capacity','excel','timeline','dashboard','releases'].forEach(f=>vm.runInThisContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8')));
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS',name)};
const demo=SGP.demo();
test('demo: referências e datas válidas',()=>assert.deepEqual(SGP.validate(demo).errors,[]));
test('histórico de versões mostra somente regras voltadas aos usuários',()=>{const html=SGP.releasePanel(),shell=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');assert.equal(SGP.releases[0].version,'1.0.2');assert.equal((html.match(/<details class="release-entry">/g)||[]).length,3);assert(html.includes('Cobertura e riscos'));assert(html.includes('Filtros e dados'));assert(!html.includes('numeração de versão própria'));assert(!html.includes('Acesso demonstrativo'));assert(!html.includes('SGP/SGP'));assert(!html.includes('<a '));assert(shell.indexOf('js/releases.js')<shell.indexOf('js/app.js'));assert(app.includes('SGP.releasePanel()'));assert.equal(demo.version,1)});
test('data impossível, referência e ID duplicado',()=>{const d=structuredClone(demo);d.demandas[0].start='2026-02-30';d.pessoas.push(d.pessoas[0]);d.alocacoes[0].person='inexistente';const v=SGP.validate(d);assert(v.errors.some(x=>x.includes('data inválida')));assert(v.errors.some(x=>x.includes('ID duplicado')));assert(v.errors.some(x=>x.includes('Pessoa inexistente')))});
test('pipeline: dias corridos desde a entrada, inclusive hoje e ausência de data',()=>{assert.equal(SGP.daysSinceEntry('2026-09-28','2026-09-29'),1);assert.equal(SGP.daysSinceEntry('2026-09-29','2026-09-29'),0);assert.equal(SGP.daysSinceEntry('2026-09-30','2026-09-29'),0);assert.equal(SGP.daysSinceEntry('','2026-09-29'),null);assert.equal(SGP.daysSinceEntry('2026-02-30','2026-09-29'),null);const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');assert(app.includes("entry:SGP.today()"));assert(app.includes('aria-label="Informar data de entrada de ${e(d.code)}"'))});
test('ordem invertida e números inválidos',()=>{const d=structuredClone(demo);d.alocacoes[0].end='2000-01-01';d.demandas[0].progress=101;d.pessoas[0].capacity=-1;assert(SGP.validate(d).errors.length>=3)});
test('referências em fases e marcos',()=>{const d=structuredClone(demo);d.fases[0].demand='x';d.marcos[0].demand='x';assert.equal(SGP.validate(d).errors.length,2)});
test('Excel real: gravação e leitura preservam entidades e percentual calculado',()=>{const buffer=XLSX.write(SGP.workbook(demo),{type:'buffer',bookType:'xlsx'});assert.equal(Buffer.from(buffer.slice(0,2)).toString(),'PK');const parsed=SGP.parseWorkbook(XLSX.read(buffer,{type:'buffer'}));assert.deepEqual(parsed.errors,[]);for(const key of Object.keys(SGP.schemas))for(let i=0;i<demo[key].length;i++)for(const [f] of SGP.schemas[key]){const expected=key==='alocacoes'&&f==='percent'?Math.round(SGP.allocationPercent(demo,demo[key][i])*10)/10:demo[key][i][f]??'';assert.equal(parsed.data[key][i][f]??'',expected)}fs.writeFileSync(path.join(root,'Modelo-SGP.xlsx'),buffer)});
test('Excel sem aba ou coluna não é aceito',()=>{const wb=SGP.workbook(demo);delete wb.Sheets.Pessoas;delete wb.Sheets.Demandas.A1;assert(SGP.parseWorkbook(wb).errors.length>=2)});
test('Excel célula de data serial',()=>{const wb=SGP.workbook(demo);wb.Sheets.Demandas.N2={t:'n',v:46200};const parsed=SGP.parseWorkbook(wb);assert(SGP.validDate(parsed.data.demandas[0].start))});
test('Excel com aba vazia mantém cabeçalhos',()=>assert.deepEqual(SGP.parseWorkbook(SGP.workbook(SGP.empty())).errors,[]));
test('localStorage e reload de dados',()=>{SGP.storage.save(demo);assert.deepEqual(SGP.storage.load(),demo)});
test('capacidade proporcional, sobrealocação e conflito',()=>{const d=SGP.empty();d.demandas=[{id:'D'}];d.pessoas=[{id:'P',name:'A',active:'Sim',front:'Produção',capacity:160}];d.alocacoes=[{person:'P',demand:'D',start:'2026-09-01',end:'2026-09-30',hours:180}];const c=SGP.capacity(d,'2026-09-01','2026-09-15')[0];assert(Math.abs(c.hours-90)<.001);assert(Math.abs(c.available-88)<.001);assert(c.conflict);assert(Math.abs(c.util-(90/88*100))<.001)});
test('intervalos fora do período não afetam capacidade',()=>{const d=structuredClone(demo);assert(SGP.capacity(d,'2000-01-01','2000-01-31').every(p=>p.hours===0&&!p.conflict))});
test('timeline nas três escalas e estado vazio',()=>{for(const scale of ['Semana','Mês','Trimestre']){const html=SGP.timeline(demo,demo.demandas,{scale,anchor:SGP.today().slice(0,7)+'-01',group:'front'});assert(html.includes('P001'));assert(!html.includes('NaN'))}assert(SGP.timeline(SGP.empty(),[],{scale:'Mês',anchor:'2026-01-01'}).includes('Nenhuma demanda'))});
test('impressão do cronograma identifica o agrupamento e período selecionados',()=>{for(const [group,label] of [['front','Por frente'],['phase','Por fase']]){const html=SGP.timeline(demo,demo.demandas,{scale:'Mês',anchor:'2026-09-01',group,closed:[]});assert(html.includes('data-action="print-timeline"'));assert(html.includes(`Cronograma executivo — ${label}`));assert(html.includes('Escala: Mês'));assert(html.includes('01/09 a 31/12'))}});
test('XSS neutralizado',()=>assert.equal(SGP.esc('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;'));
test('sem dados: dashboard sem NaN ou Infinity',()=>{const html=SGP.dashboard(SGP.empty(),[],{scale:'Mês',anchor:'2026-01-01'},'2026-01-01','2026-01-31');assert(!html.includes('NaN'));assert(!html.includes('Infinity'))});
test('volume: 500 demandas, 200 pessoas, 2000 alocações, 5000 fases',()=>{const d=SGP.empty();for(let i=0;i<500;i++)d.demandas.push({...demo.demandas[i%15],id:'D'+i,code:'D'+i});for(let i=0;i<200;i++)d.pessoas.push({...demo.pessoas[i%22],id:'P'+i});for(let i=0;i<2000;i++)d.alocacoes.push({...demo.alocacoes[0],person:'P'+(i%200),demand:'D'+(i%500)});for(let i=0;i<5000;i++)d.fases.push({...demo.fases[i%90],demand:'D'+(i%500)});const t=performance.now();assert.equal(SGP.validate(d).errors.length,0);const html=SGP.dashboard(d,d.demandas,{scale:'Mês',anchor:SGP.today().slice(0,7)+'-01'},SGP.today().slice(0,7)+'-01',SGP.add(SGP.today().slice(0,7)+'-01',29));assert(html.includes('D499'));console.log('  cálculo e HTML:',Math.round(performance.now()-t)+'ms');fs.writeFileSync(path.join(root,'tests','volume-500.json'),JSON.stringify(d))});
test('sobreposição: mesma demanda, limites inclusivos e intervalos separados',()=>{
 const d=structuredClone(demo);d.fases=[{...demo.fases[0],id:'F1',start:'2026-09-01',end:'2026-09-10'},{...demo.fases[0],id:'F2',start:'2026-09-10',end:'2026-09-20'}];
 const overlaps=()=>SGP.validate(d).warnings.filter(w=>w.includes('sobreposição'));
 assert.equal(overlaps().length,1);assert(overlaps()[0].includes('linha 2 e 3'));
 d.fases[1].start='2026-09-11';assert.equal(overlaps().length,0);
 d.fases[1].start='2026-09-05';d.fases[1].demand=demo.demandas[1].id;assert.equal(overlaps().length,0);
});
test('marcos fora do período identificam registro e demanda',()=>{
 const d=structuredClone(demo);d.marcos[0].date='2000-01-01';const w=SGP.validate(d).warnings.find(w=>w.startsWith('Marcos, linha 2:'));assert(w.includes(d.marcos[0].name));assert(w.includes(d.demandas.find(x=>x.id===d.marcos[0].demand).code));
});
test('alertas de execução: limites, dados ausentes e demandas encerradas',()=>{
 const d=structuredClone(demo);d.fases=[];const demand={...d.demandas[0],estimated:100,consumed:80,progress:30,status:'Em andamento'};d.demandas=[demand];
 const risks=()=>SGP.executionRisks(d,d.demandas);
 assert.equal(risks()[0].type,'Consumo acima da evolução');assert.equal(risks()[0].severity,'Alta');
 demand.consumed=50;assert.equal(risks()[0].severity,'Média');demand.consumed=49;assert.equal(risks().length,0);
 demand.consumed=80;demand.progress=61;assert.equal(risks().length,0);
 demand.progress='';assert.equal(risks().length,0);demand.consumed=101;assert.equal(risks()[0].type,'Horas excedidas');
 demand.estimated=0;assert.equal(risks().length,0);demand.estimated=100;
 for(const status of ['Concluído','Cancelado']){demand.status=status;assert.equal(risks().length,0)}
});
test('fase vencida: ontem, hoje, encerramento e filtro de demanda',()=>{
 const d=structuredClone(demo),demand={...d.demandas[0],status:'Em andamento',estimated:0};d.demandas=[demand];d.fases=[{demand:demand.id,phase:'Desenvolvimento',end:SGP.add(SGP.today(),-1),status:'Em andamento'}];
 assert.equal(SGP.executionRisks(d,[demand])[0].type,'Fase vencida');assert.equal(SGP.executionRisks(d,[]).length,0);
 d.fases[0].end=SGP.today();assert.equal(SGP.executionRisks(d,[demand]).length,0);
 d.fases[0].end=SGP.add(SGP.today(),-1);d.fases[0].status='Concluído';assert.equal(SGP.executionRisks(d,[demand]).length,0);
 assert.equal(SGP.executionPanel([]),'');
});
test('alocação: limites inclusivos, pessoa inativa e percentual automático',()=>{
 const d=SGP.empty();d.demandas=[{id:'D'}];d.pessoas=[{id:'P',name:'Ativa',front:'Produção',capacity:160,active:'Sim'},{id:'I',name:'Inativa',front:'Produção',capacity:160,active:'Não'}];
 d.alocacoes=[{person:'P',demand:'D',start:'2026-02-01',end:'2026-02-28',hours:160,percent:10},{person:'I',demand:'D',start:'2026-02-01',end:'2026-02-28',hours:160,percent:100}];
 const [row]=SGP.capacity(d,'2026-02-01','2026-02-28');assert(Math.abs(row.hours-160)<.001);assert(Math.abs(row.available-160)<.001);assert(Math.abs(row.util-100)<.001);assert(!row.conflict);
 assert.equal(Math.round(SGP.allocationPercent(d,d.alocacoes[0])*10)/10,100);d.alocacoes[0].hours=40;assert.equal(Math.round(SGP.allocationPercent(d,d.alocacoes[0])*10)/10,25);assert.equal(SGP.capacity(d,'2026-02-01','2026-02-28')[0].hours,40);
});
test('alocação: período parcial e virada de mês conservam horas e capacidade',()=>{
 const d=SGP.empty();d.demandas=[{id:'D'}];d.pessoas=[{id:'P',name:'A',front:'Produção',capacity:160,active:'Sim'}];d.alocacoes=[{person:'P',demand:'D',start:'2026-01-30',end:'2026-02-02',hours:20}];
 const [row]=SGP.capacity(d,'2026-01-30','2026-02-02');assert.equal(row.hours,20);assert(Math.abs(row.available-16)<.001);assert(row.conflict);
 const [oneDay]=SGP.capacity(d,'2026-02-02','2026-02-02');assert.equal(oneDay.hours,10);assert(Math.abs(oneDay.available-8)<.001);
});
test('jornada: semana, fim de semana e sobreposição diária',()=>{
 const d=SGP.empty();d.demandas=[{id:'D'},{id:'E'}];d.pessoas=[{id:'P',active:'Sim',capacity:160}];
 d.alocacoes=[{person:'P',demand:'D',start:'2026-09-21',end:'2026-09-27',hours:40}];
 assert.equal(SGP.allocationPercent(d,d.alocacoes[0]),100);
 let row=SGP.capacity(d,'2026-09-21','2026-09-27')[0];assert.equal(row.available,40);assert.equal(row.hours,40);assert(!row.conflict);
 row=SGP.capacity(d,'2026-09-26','2026-09-27')[0];assert.equal(row.available,0);assert.equal(row.hours,0);assert(!row.conflict);
 d.alocacoes.push({person:'P',demand:'E',start:'2026-09-21',end:'2026-09-27',hours:8});
 row=SGP.capacity(d,'2026-09-21','2026-09-27')[0];assert.equal(row.util,120);assert(row.conflict);
 d.alocacoes[0].hours=20;row=SGP.capacity(d,'2026-09-21','2026-09-27')[0];assert(row.overlap);assert(!row.conflict);
 assert.equal(SGP.workdays('2026-09-01','2026-09-30'),22);
 assert.equal(SGP.allocationPercent(d,{person:'P',start:'2026-09-26',end:'2026-09-27',hours:8}),null);
 const invalid=structuredClone(demo);invalid.alocacoes[0].start='2026-09-26';invalid.alocacoes[0].end='2026-09-27';assert(SGP.validate(invalid).errors.some(e=>e.includes('segunda a sexta')));
});
test('fases: cronograma automático, orçamento, espera e preservação do consumo',()=>{
 const d=SGP.empty();d.demandas=[{id:'D',code:'D',name:'Projeto',type:'Projeto',front:'Produção',phase:'Entrada',status:'Não iniciado',estimated:100,consumed:12,scheduleAuto:'Sim',deadline:'2026-10-15'}];
 assert.equal(SGP.validate(d).errors.length,0);
 SGP.syncPhaseSchedule(d);assert.equal(d.demandas[0].start,'');
 d.fases=[{demand:'D',phase:'Levantamento',start:'2026-10-01',end:'2026-10-02',status:'Não iniciado',budget:'Sim',plannedHours:16},{demand:'D',phase:'Desenvolvimento',start:'2026-10-05',end:'2026-10-09',status:'Não iniciado',budget:'Sim',plannedHours:40},{demand:'D',phase:'Homologação',start:'2026-10-12',end:'2026-10-16',status:'Não iniciado',budget:'Não',plannedHours:0}];
 SGP.syncPhaseSchedule(d);assert.equal(d.demandas[0].start,'2026-10-01');assert.equal(d.demandas[0].end,'2026-10-16');assert.equal(d.demandas[0].technical,'2026-10-09');assert.equal(d.demandas[0].consumed,12);assert.equal(SGP.phaseBudget(d,'D').remaining,44);
 assert(SGP.validate(d).warnings.some(w=>w.includes('entrega acordada')));
 d.fases[1].plannedHours=100;assert.equal(SGP.phaseBudget(d,'D').remaining,-16);assert(SGP.validate(d).warnings.some(w=>w.includes('116h')));
 d.fases[2].plannedHours=8;assert(SGP.validate(d).errors.some(w=>w.includes('0 horas')));d.fases[2].plannedHours=0;
 const roundtrip=SGP.parseWorkbook(SGP.workbook(d));assert.equal(roundtrip.data.fases[1].plannedHours,100);assert.equal(roundtrip.data.fases[2].budget,'Não');
 d.fases=[];SGP.syncPhaseSchedule(d);assert.equal(d.demandas[0].end,'');assert.equal(SGP.phaseBudget(d,'D').remaining,100);
 d.demandas[0].scheduleAuto='Não';d.demandas[0].start='2026-10-01';SGP.syncPhaseSchedule(d);assert.equal(d.demandas[0].start,'2026-10-01');
});
test('Excel legado: novas colunas são opcionais e valores originais preservados',()=>{
 const wb=SGP.workbook(demo);
 for(const key of ['demandas','fases']){const name=SGP.sheetNames[key],rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1});const omit=['Cronograma pelas fases','Entrega acordada com cliente','Consome horas da estimativa','Horas planejadas'];const indices=rows[0].map((h,i)=>omit.includes(h)?-1:i).filter(i=>i>=0);wb.Sheets[name]=XLSX.utils.aoa_to_sheet(rows.map(row=>indices.map(i=>row[i])));}
 const result=SGP.parseWorkbook(wb);assert.deepEqual(result.errors,[]);assert.equal(result.data.demandas[0].consumed,demo.demandas[0].consumed);assert.equal(result.data.demandas[0].start,demo.demandas[0].start);
});
test('demonstração: fases classificadas, orçamento fechado e datas sincronizadas',()=>{
 assert.deepEqual(SGP.validate(demo).warnings,[]);
 for(const d of demo.demandas){const phases=demo.fases.filter(p=>p.demand===d.id),budget=SGP.phaseBudget(demo,d.id);
 assert.equal(d.scheduleAuto,'Sim');assert.equal(budget.unclassified,0);assert.equal(budget.planned,d.estimated);assert.equal(budget.remaining,0);
 assert(phases.some(p=>p.budget==='Não'&&p.plannedHours===0));assert(phases.some(p=>p.budget==='Sim'&&p.plannedHours>0));
 assert.equal(d.start,phases.map(p=>p.start).sort()[0]);assert.equal(d.end,phases.map(p=>p.end).sort().at(-1));assert.equal(d.nextDate,'');assert(SGP.nextMilestone(demo,d.id));
 }
});
test('marcos legados: migração idempotente, sem duplicação ou ressurreição',()=>{
 const d=SGP.empty();d.demandas=[{id:'D',next:'Aceite',nextDate:'2026-10-10'}];
 SGP.migrateMilestones(d);assert.equal(d.marcos.length,1);assert.equal(d.demandas[0].next,'');
 SGP.migrateMilestones(d);assert.equal(d.marcos.length,1);assert.equal(SGP.nextMilestone(d,'D').name,'Aceite');
 d.marcos[0].status='Concluído';assert.equal(SGP.nextMilestone(d,'D'),undefined);
 d.demandas[0].next='Aceite';d.demandas[0].nextDate='2026-10-10';SGP.migrateMilestones(d);assert.equal(d.marcos.length,1);
 d.marcos=[];SGP.migrateMilestones(d);assert.equal(d.marcos.length,0);
 const legacy=structuredClone(demo);legacy.demandas[0].next='Aceite extra';legacy.demandas[0].nextDate=legacy.demandas[0].end;
 const result=SGP.parseWorkbook(SGP.workbook(legacy));assert.deepEqual(result.errors,[]);assert(result.data.marcos.some(m=>m.name==='Aceite extra'));assert.equal(result.data.demandas[0].next,'');
});
test('detalhes: resumo do projeto separado de fases, marcos e alocações',()=>{
 const source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
 const detail=source.slice(source.indexOf('function detail(id)'),source.indexOf('function edit(key'));
 const captures=[];const context=vm.createContext({data:demo,SGP,e:SGP.esc,modal:(...args)=>captures.push(args)});
 vm.runInContext(detail,context);
 for(const d of demo.demandas){
  context.id=d.id;vm.runInContext('detail(id)',context);
  const [title,body]=captures.at(-1),summary=body.slice(0,body.indexOf('<div class="delivery-window">'));
  assert.equal(title,d.code+' · '+d.name);assert(summary.includes('<small>Evolução</small>'));assert(summary.includes('<small>Frente</small>'));
  assert(!summary.includes('<small>Fase</small>'));assert(!summary.includes('<small>Próximo marco</small>'));
  for(const key of ['fases','marcos','alocacoes'])assert(body.includes('data-new="'+key+'"'));
  assert(body.includes('<th>Fase</th><th>Início</th><th>Fim</th>'));assert(body.includes('<th>Marco</th><th>Data</th>'));
  assert(body.includes('Próximo marco pendente:'));assert(body.includes('Desenvolvimento'));
 }
 const partial=SGP.empty();partial.demandas=[{id:'P',code:'P',name:'Teste',estimated:600,consumed:0}];partial.fases=[{demand:'P',phase:'Desenvolvimento',budget:'Sim',plannedHours:40,start:'2026-09-28',end:'2026-10-02',status:'Em andamento'}];context.data=partial;context.id='P';vm.runInContext('detail(id)',context);
 assert(captures.at(-1)[1].includes('As fases ainda não contemplam toda a estimativa da demanda: faltam 560h para planejar.'));
 partial.demandas[0].estimated=40;vm.runInContext('detail(id)',context);assert(!captures.at(-1)[1].includes('As fases ainda não contemplam'));
 const empty=SGP.empty();empty.demandas=[{id:'X',code:'X',name:'Sem planejamento',progress:0}];context.data=empty;context.id='X';vm.runInContext('detail(id)',context);assert(!captures.at(-1)[1].includes('NaN'));
});
test('fase vencida: contexto previsto hoje, sobreposições e períodos sem fase',()=>{
 const originalToday=SGP.today;SGP.today=()=> '2026-10-15';
 try{
 const d=SGP.empty();d.demandas=[{id:'D',status:'Em andamento',estimated:0},{id:'OTHER',status:'Em andamento'}];
 d.fases=[{demand:'D',phase:'Levantamento',start:'2026-10-01',end:'2026-10-05',status:'Não iniciado'},{demand:'D',phase:'Desenvolvimento',start:'2026-10-06',end:'2026-10-14',status:'Em andamento'},{demand:'D',phase:'Homologação',start:'2026-10-15',end:'2026-10-20',status:'Não iniciado'},{demand:'OTHER',phase:'Implantação',start:'2026-10-15',end:'2026-10-20',status:'Em andamento'}];
 let risks=SGP.executionRisks(d,[d.demandas[0]]);assert.equal(risks.length,2);assert(risks.every(r=>r.description.includes('prevista a fase: Homologação')));assert(risks[0].description.includes('10 dia(s)'));assert(risks[1].description.includes('1 dia(s)'));assert(!risks[0].description.includes('Implantação'));
 d.fases.push({demand:'D',phase:'Implantação',start:'2026-10-10',end:'2026-10-15',status:'Não iniciado'});risks=SGP.executionRisks(d,[d.demandas[0]]);assert.equal(risks.length,2);assert(risks[0].description.includes('previstas as fases: Homologação, Implantação'));
 d.fases.at(-1).status='Cancelado';d.fases[2].start='2026-10-16';risks=SGP.executionRisks(d,[d.demandas[0]]);assert(risks[0].description.includes('Não há fase prevista'));
 d.fases[0].status='Concluído';d.fases[1].status='Cancelado';assert.equal(SGP.executionRisks(d,[d.demandas[0]]).length,0);
 d.fases[0].status='Bloqueado';assert.equal(SGP.executionRisks(d,[d.demandas[0]]).length,1);
 d.demandas[0].status='Concluído';assert.equal(SGP.executionRisks(d,[d.demandas[0]]).length,0);
 }finally{SGP.today=originalToday}
});
test('cobertura: esforço, espera, período, inativos e sobrecarga entre demandas',()=>{
 const d=SGP.empty();const project={id:'D',code:'D',estimated:80,consumed:40};d.demandas=[project,{id:'E'}];d.pessoas=[{id:'P',name:'Pessoa',active:'Sim'}];
 d.fases=[{demand:'D',budget:'Sim',plannedHours:80,start:'2026-10-05',end:'2026-10-16'},{demand:'D',budget:'Não',plannedHours:0,start:'2026-10-19',end:'2026-10-23'}];
 d.alocacoes=[{demand:'D',person:'P',hours:40,start:'2026-10-05',end:'2026-10-16'}];
 let c=SGP.coverage(d,project);assert.equal(c.required,80);assert.equal(c.allocated,40);assert.equal(c.missing,40);assert.equal(c.percent,50);assert(!c.incomplete);
 c=SGP.coverage(d,project,'2026-10-05','2026-10-09');assert.equal(c.required,40);assert.equal(c.allocated,20);
 c=SGP.coverage(d,project,'2026-10-10','2026-10-11');assert.equal(c.required,0);assert.equal(c.allocated,0);assert.equal(c.percent,null);
 c=SGP.coverage(d,project,'2026-10-19','2026-10-23');assert.equal(c.required,0);
 d.alocacoes.push({demand:'E',person:'P',hours:80,start:'2026-10-05',end:'2026-10-16'});assert.deepEqual(SGP.coverage(d,project).overloaded,['Pessoa']);
 d.pessoas[0].active='Não';c=SGP.coverage(d,project);assert.equal(c.allocated,0);assert(c.notes.length);
 d.pessoas[0].active='Sim';d.alocacoes[0].hours=100;c=SGP.coverage(d,project);assert.equal(c.excess,20);assert.equal(c.missing,0);
 project.estimated=120;c=SGP.coverage(d,project);assert(c.incomplete);assert.equal(c.required,120);
 const html=SGP.coveragePanel(d,[project]);assert(html.includes('Cobertura de horas'));assert(!html.includes('NaN'));
});
test('alocação criada na demanda: capacidade e percentual respeitam o período',()=>{
 const d=SGP.empty();d.demandas=[{id:'D',code:'D',front:'Produção',status:'Em andamento'}];d.pessoas=[{id:'P',name:'Pessoa',front:'Produção',active:'Sim',capacity:160}];
 d.alocacoes.push({person:'P',demand:'D',start:'2026-10-05',end:'2026-10-16',hours:40});
 const a=d.alocacoes[0];assert.equal(SGP.workdays(a.start,a.end),10);assert.equal(SGP.allocationPercent(d,a),50);
 let row=SGP.capacity(d,a.start,a.end)[0];assert.equal(row.available,80);assert.equal(row.hours,40);assert.equal(row.util,50);
 row=SGP.capacity(d,'2026-10-05','2026-10-09')[0];assert.equal(row.available,40);assert.equal(row.hours,20);assert.equal(row.util,50);
 row=SGP.capacity(d,'2026-09-01','2026-09-30')[0];assert.equal(row.hours,0);
 assert.equal(SGP.hours(0.46),'0,5h');assert.equal(SGP.hours(row.hours),'0h');
 d.alocacoes[0].hours=80;assert.equal(SGP.allocationPercent(d,d.alocacoes[0]),100);assert.equal(SGP.capacity(d,a.start,a.end)[0].hours,80);
 d.pessoas[0].active='Não';assert.equal(SGP.capacity(d,a.start,a.end).length,0);
});
test('percentual acima de 100 e risco detalhado permanecem visíveis',()=>{
 const d=structuredClone(demo),a=d.alocacoes[0];a.hours=SGP.workdays(a.start,a.end)*10;
 a.percent=SGP.allocationPercent(d,a);assert.equal(a.percent,125);
 assert(!SGP.validate(d).errors.some(error=>error.includes('Percentual')));
 assert(SGP.capacity(d,a.start,a.end).find(p=>p.id===a.person).conflict);
 const state={filters:{},deliveryDays:30,scale:'Mês',group:'front',closed:[],anchor:SGP.today().slice(0,7)+'-01'};
 const start=SGP.today().slice(0,7)+'-01',end=SGP.add(start,30);
 SGP.dashboard(d,d.demandas,state,start,end);
 assert(SGP.kpiTips[3].includes(' — '));assert(SGP.kpiTips[3].includes('('));
});
test('marcos só aparecem após cadastro explícito',()=>{
 const d=SGP.empty(),today=SGP.today();d.demandas=[{id:'D',code:'D',name:'Teste',front:'Produção',phase:'Desenvolvimento',status:'Em andamento',start:today,end:SGP.add(today,10),technical:SGP.add(today,5)}];
 const state={anchor:today.slice(0,7)+'-01',scale:'Mês',group:'front',closed:[]};
 assert.equal(SGP.deliveries(d,d.demandas,30).length,0);
 assert(!SGP.timeline(d,d.demandas,state).includes('class="milestone '));
 d.marcos=[{demand:'D',name:'Entrega técnica',date:SGP.add(today,5),status:'Não iniciado'}];
 assert.deepEqual(SGP.deliveries(d,d.demandas,30).map(m=>m.name),['Entrega técnica']);
 assert(SGP.timeline(d,d.demandas,state).includes('class="milestone tech"'));
 d.marcos[0].status='Concluído';assert.equal(SGP.deliveries(d,d.demandas,30).length,0);
 d.marcos=[];assert(!SGP.timeline(d,d.demandas,state).includes('class="milestone '));
});
test('risco de prazo exige data final válida e passada',()=>{
 const d=SGP.empty(),project={id:'D',code:'D',status:'Não iniciado',risk:'Nenhum',end:'',estimated:0,consumed:0};d.demandas=[project];
 assert.equal(SGP.risks(d,d.demandas,[]).length,0);
 project.end=SGP.add(SGP.today(),-1);assert(SGP.risks(d,d.demandas,[]).some(r=>r.type==='Prazo vencido'));
 project.status='Concluído';assert.equal(SGP.risks(d,d.demandas,[]).length,0);
});
test('marco bloqueado aparece nos riscos e no indicador da visão geral',()=>{
 const d=SGP.empty(),project={id:'D',code:'D',name:'Projeto',front:'Produção',status:'Em andamento',risk:'Nenhum',estimated:0,consumed:0};
 d.demandas=[project];d.marcos=[{demand:'D',name:'Aceite técnico',date:SGP.add(SGP.today(),10),status:'Bloqueado',notes:'Aguardando liberação'}];
 let risks=SGP.risks(d,d.demandas,[]);assert.equal(risks.length,1);assert.equal(risks[0].type,'Marco bloqueado');assert.equal(risks[0].severity,'Alta');assert(risks[0].description.includes('Aceite técnico'));assert(risks[0].description.includes('Aguardando liberação'));
 const state={filters:{},deliveryDays:30,scale:'Mês',group:'front',closed:[],anchor:SGP.today().slice(0,7)+'-01'};
 const html=SGP.dashboard(d,d.demandas,state,SGP.today().slice(0,7)+'-01',SGP.today());assert(html.includes('Demandas em risco'));assert(SGP.kpiTips[3].includes('Marco bloqueado'));
 d.marcos[0].status='Concluído';assert.equal(SGP.risks(d,d.demandas,[]).length,0);
 d.marcos[0].status='Bloqueado';project.status='Concluído';assert.equal(SGP.risks(d,d.demandas,[]).length,0);
});
test('estimativa de 600h com 40h alocadas gera risco de cobertura',()=>{
 const d=SGP.empty(),project={id:'D',code:'D',name:'Projeto',status:'Em andamento',estimated:600,consumed:0,risk:'Nenhum'};
 d.demandas=[project];d.pessoas=[{id:'P',name:'Profissional',front:'Produção',active:'Sim'}];
 d.alocacoes=[{demand:'D',person:'P',hours:40,start:'2026-10-19',end:'2026-12-31'}];
 let risk=SGP.risks(d,d.demandas,[]).find(r=>r.type==='Horas sem alocação');
 assert(risk);assert.equal(risk.severity,'Alta');assert(risk.description.includes('560h'));assert(risk.description.includes('40h'));
 d.alocacoes[0].hours=600;assert(!SGP.risks(d,d.demandas,[]).some(r=>r.type==='Horas sem alocação'));
 d.alocacoes[0].hours=40;project.status='Concluído';assert(!SGP.risks(d,d.demandas,[]).some(r=>r.type==='Horas sem alocação'));
 project.status='Em andamento';d.pessoas[0].active='Não';risk=SGP.risks(d,d.demandas,[]).find(r=>r.type==='Horas sem alocação');assert(risk.description.includes('600h'));
});
console.log(`${count} testes passaram.`);
