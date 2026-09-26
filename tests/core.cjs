const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');global.window=global;global.XLSX=require('../vendor/xlsx.full.min.js');const store=new Map();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
['utils','data','validation','capacity','excel','timeline','dashboard'].forEach(f=>vm.runInThisContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8')));
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS',name)};
const demo=SGP.demo();
test('demo: referências e datas válidas',()=>assert.deepEqual(SGP.validate(demo).errors,[]));
test('data impossível, referência e ID duplicado',()=>{const d=structuredClone(demo);d.demandas[0].start='2026-02-30';d.pessoas.push(d.pessoas[0]);d.alocacoes[0].person='inexistente';const v=SGP.validate(d);assert(v.errors.some(x=>x.includes('data inválida')));assert(v.errors.some(x=>x.includes('ID duplicado')));assert(v.errors.some(x=>x.includes('Pessoa inexistente')))});
test('ordem invertida e números inválidos',()=>{const d=structuredClone(demo);d.alocacoes[0].end='2000-01-01';d.demandas[0].progress=101;d.pessoas[0].capacity=-1;assert(SGP.validate(d).errors.length>=3)});
test('referências em fases e marcos',()=>{const d=structuredClone(demo);d.fases[0].demand='x';d.marcos[0].demand='x';assert.equal(SGP.validate(d).errors.length,2)});
test('Excel real: gravação e leitura preservam todas as entidades',()=>{const buffer=XLSX.write(SGP.workbook(demo),{type:'buffer',bookType:'xlsx'});assert.equal(Buffer.from(buffer.slice(0,2)).toString(),'PK');const parsed=SGP.parseWorkbook(XLSX.read(buffer,{type:'buffer'}));assert.deepEqual(parsed.errors,[]);for(const key of Object.keys(SGP.schemas))for(let i=0;i<demo[key].length;i++)for(const [f] of SGP.schemas[key])assert.equal(parsed.data[key][i][f]??'',demo[key][i][f]??'');fs.writeFileSync(path.join(root,'Modelo-SGP.xlsx'),buffer)});
test('Excel sem aba ou coluna não é aceito',()=>{const wb=SGP.workbook(demo);delete wb.Sheets.Pessoas;delete wb.Sheets.Demandas.A1;assert(SGP.parseWorkbook(wb).errors.length>=2)});
test('Excel célula de data serial',()=>{const wb=SGP.workbook(demo);wb.Sheets.Demandas.N2={t:'n',v:46200};const parsed=SGP.parseWorkbook(wb);assert(SGP.validDate(parsed.data.demandas[0].start))});
test('Excel com aba vazia mantém cabeçalhos',()=>assert.deepEqual(SGP.parseWorkbook(SGP.workbook(SGP.empty())).errors,[]));
test('localStorage e reload de dados',()=>{SGP.storage.save(demo);assert.deepEqual(SGP.storage.load(),demo)});
test('capacidade proporcional, sobrealocação e conflito',()=>{const d=SGP.empty();d.demandas=[{id:'D'}];d.pessoas=[{id:'P',name:'A',active:'Sim',front:'Produção',capacity:160}];d.alocacoes=[{person:'P',demand:'D',start:'2026-09-01',end:'2026-09-30',hours:180}];const c=SGP.capacity(d,'2026-09-01','2026-09-15')[0];assert(Math.abs(c.hours-90)<.001);assert(Math.abs(c.available-80)<.001);assert(c.conflict);assert(Math.abs(c.util-112.5)<.001)});
test('intervalos fora do período não afetam capacidade',()=>{const d=structuredClone(demo);assert(SGP.capacity(d,'2000-01-01','2000-01-31').every(p=>p.hours===0&&!p.conflict))});
test('timeline nas três escalas e estado vazio',()=>{for(const scale of ['Semana','Mês','Trimestre']){const html=SGP.timeline(demo,demo.demandas,{scale,anchor:SGP.today().slice(0,7)+'-01',group:'front'});assert(html.includes('P001'));assert(!html.includes('NaN'))}assert(SGP.timeline(SGP.empty(),[],{scale:'Mês',anchor:'2026-01-01'}).includes('Nenhuma demanda'))});
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
console.log(`${count} testes passaram.`);
