SGP.demo=()=>{
 const today=SGP.today(), month=today.slice(0,7)+'-01';
 const data={version:1,demandas:[],pessoas:[],alocacoes:[],fases:[],marcos:[],settings:{},updated:new Date().toISOString()};
 const names=[['Melhoria Linha 1','Integração MES','Eficiência de montagem'],['Rastreabilidade','Relatórios QMS','Inspeção digital'],['Calibração ERP','Coleta de Dados','Auditoria de torque'],['Integração PLC','Dashboard IIoT','Monitoramento de células'],['Piloto Sensor','Plataforma IoT','Conectividade industrial']];
 const leaders=['Hewerton','Rodrigo','Serginho','Hissao','Raphera'];
 SGP.fronts.forEach((front,f)=>{
  for(let p=0;p<(f===3?6:4);p++)data.pessoas.push({id:`PE${f}${p}`,name:p===0?leaders[f]:['Ana','Bruno','Camila','Diego','Elisa'][p-1]+' '+['Silva','Costa','Lima','Souza','Melo'][f],role:p===0?'Tech Leader':'Analista',front,leader:leaders[f],capacity:160,active:'Sim'});
  names[f].forEach((name,i)=>{
   const id=['P','Q','T','A','I'][f]+String(i+1).padStart(3,'0'),start=SGP.add(month,-10+i*17+f*3),end=SGP.add(start,48+i*18),technical=SGP.add(end,-15),status=i===2?'Não iniciado':f===2&&i===1?'Aguardando cliente':f===3&&i===1?'Em risco':f===1&&i===1?'Aguardando aprovação':'Em andamento';
   data.demandas.push({id,code:id,name,description:'Demanda demonstrativa de melhoria da operação '+front+'.',type:i===2?'Proposta':'Melhoria',front,plan:'Cliente '+(f%2+1),pmo:f%2?'Marina':'Lucas',leader:leaders[f],bo:'Business Operations',phase:i===2?'Proposta':status==='Aguardando aprovação'?'Aprovação':'Desenvolvimento',status,entry:SGP.add(start,-7),start,technical,homologation:SGP.add(end,-9),deployment:SGP.add(end,-3),end,estimated:240+i*80,consumed:i===2?0:120,progress:i===2?0:45,next:'Entrega técnica',nextDate:technical,dependency:status.includes('Aguardando')?'Validação do cliente':'',dependencyOwner:status.includes('Aguardando')?'Plan':'',risk:status==='Em risco'?'Alta':status.includes('Aguardando')?'Média':'Nenhum',riskDescription:status==='Em risco'?'Equipe acima da capacidade no período.':status.includes('Aguardando')?'Decisão do cliente necessária para avançar.':'',git:'',notes:'Dados fictícios para demonstração.'});
   [['Levantamento',0,5],['Proposta',6,10],['Planejamento',11,15],['Desenvolvimento',16,SGP.days(start,technical)-1],['Homologação',SGP.days(start,technical),SGP.days(start,end)-5],['Implantação',SGP.days(start,end)-4,SGP.days(start,end)-1]].forEach(([phase,a,b])=>data.fases.push({demand:id,phase,start:SGP.add(start,a),end:SGP.add(start,b),status:'Em andamento'}));
   [['Entrega técnica',technical],['Go-live',SGP.add(end,-3)],['Entrega final',end]].forEach(([name,date])=>data.marcos.push({demand:id,name,date,status:'Não iniciado',notes:''}));
   data.pessoas.filter(p=>p.front===front).forEach((p,n)=>data.alocacoes.push({person:p.id,demand:id,start:month,end:SGP.iso(new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0))),hours:(f===3?70:38)+i*4+n*2,percent:''}));
  });
 });return data;
};
SGP.empty=()=>({version:1,demandas:[],pessoas:[],alocacoes:[],fases:[],marcos:[],settings:{},updated:new Date().toISOString()});
SGP.storage={key:'sgp-business-operations-v1',load(){const raw=localStorage.getItem(this.key);return raw?JSON.parse(raw):SGP.demo()},save(data){data.updated=new Date().toISOString();localStorage.setItem(this.key,JSON.stringify(data))}};
