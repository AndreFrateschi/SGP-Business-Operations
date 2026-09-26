SGP.validate=data=>{
 const errors=[],warnings=[];if(!data||typeof data!=='object')return {errors:['Arquivo sem estrutura de dados.'],warnings};
 const add=(k,i,m)=>errors.push(`${SGP.sheetNames[k]}, linha ${i+2}: ${m}`),limits={demandas:500,pessoas:200,alocacoes:2000,fases:5000,marcos:5000};
 for(const [key,schema] of Object.entries(SGP.schemas)){
  if(!Array.isArray(data[key])){errors.push(`Aba ${SGP.sheetNames[key]} ausente ou inválida.`);continue}
  if(data[key].length>limits[key])warnings.push(`${SGP.sheetNames[key]} supera o volume recomendado (${limits[key]}).`);
  const ids=new Set(),codes=new Set();
  data[key].forEach((r,i)=>{
   if(!r||typeof r!=='object'||Array.isArray(r)){add(key,i,'Registro inválido.');return}
   schema.forEach(([f,label,type])=>{
    const v=r[f],empty=v===undefined||v===null||v==='';
    if((type==='required'||type?.endsWith('!'))&&empty)add(key,i,`${label} é obrigatório.`);
    if(!empty&&type?.startsWith('date')&&!SGP.validDate(v))add(key,i,`${label}: data inválida. Use AAAA-MM-DD.`);
    if(!empty&&(type?.startsWith('number')||type==='percent')&&(!Number.isFinite(Number(v))||Number(v)<0||type==='percent'&&Number(v)>100))add(key,i,`${label}: número inválido${type==='percent'?' (0 a 100)':''}.`);
    if(!empty&&['id','code','person','demand'].includes(f)&&typeof v!=='string')add(key,i,`${label}: use texto para IDs e referências.`);
    if(!empty&&typeof v==='object')add(key,i,`${label}: valor incompatível.`);
   });
   if(r.id){if(ids.has(String(r.id)))add(key,i,`ID duplicado: ${r.id}`);ids.add(String(r.id))}
   if(r.code){if(codes.has(String(r.code)))add(key,i,`Código duplicado: ${r.code}`);codes.add(String(r.code))}
   if(r.start&&r.end&&r.end<r.start)add(key,i,'Data fim anterior ao início.');
   if(r.front&&!SGP.fronts.includes(r.front))add(key,i,'Frente desconhecida.');
   if(r.status&&!SGP.statuses.includes(r.status))add(key,i,'Status desconhecido.');
   if(r.phase&&!SGP.stages.includes(r.phase))add(key,i,'Fase desconhecida.');
   if(key==='demandas'){
    if(!['Projeto','Proposta','Melhoria','Evolução','Ticket N3','Outro'].includes(r.type))add(key,i,'Tipo inválido.');
    if(r.risk&&!['Nenhum','Baixa','Média','Alta','Crítica'].includes(r.risk))add(key,i,'Risco inválido.');
    if(r.git&&!/^https?:\/\/[^\s]+$/i.test(r.git))add(key,i,'Link Git deve começar com https:// ou http://.');
    const dates=[r.start,r.technical,r.homologation,r.deployment,r.end].filter(Boolean);if(dates.some((d,j)=>j&&d<dates[j-1]))warnings.push(`Demandas, linha ${i+2}: sequência de entrega técnica, homologação e final fora de ordem.`);
    if(r.next&&!r.nextDate||r.nextDate&&!r.next)warnings.push(`Demandas, linha ${i+2}: próximo marco incompleto.`);
   }
   if(key==='pessoas'){
    if(!['Sim','Não'].includes(r.active))add(key,i,'Ativo deve ser Sim ou Não.');
    if(!['Tech Leader','Analista','Desenvolvedor','PMO','Plan','Business Operations','Outro'].includes(r.role))add(key,i,'Função desconhecida.');
   }
  });
 }
 if(Object.keys(SGP.schemas).some(k=>!Array.isArray(data[k])))return {errors,warnings};
 const demandIds=new Set((data.demandas||[]).filter(Boolean).map(d=>String(d.id))),personIds=new Set((data.pessoas||[]).filter(Boolean).map(p=>String(p.id)));
 ['alocacoes','fases','marcos'].forEach(key=>(data[key]||[]).forEach((r,i)=>{if(!r||typeof r!=='object')return;if(!demandIds.has(String(r.demand)))add(key,i,`Demanda inexistente: ${r.demand}`);if(key==='alocacoes'&&!personIds.has(String(r.person)))add(key,i,`Pessoa inexistente: ${r.person}`);if(key==='alocacoes'&&data.pessoas?.find(p=>p.id===r.person)?.active==='Não')warnings.push(`Alocacoes, linha ${i+2}: pessoa inativa.`)}));
 if(!errors.length){const by=new Map(data.demandas.map(d=>[d.id,d]));['fases','marcos'].forEach(key=>data[key].forEach((r,i)=>{const d=by.get(r.demand);if((r.date||r.start)<d.start||(r.date||r.end)>d.end)warnings.push(`${SGP.sheetNames[key]}, linha ${i+2}: ${r.name||r.phase||r.id} (${d.code||d.id}): período fora das datas da demanda (${SGP.fmt(d.start)} a ${SGP.fmt(d.end)}).`)}))}
 if(!errors.length){
  const groups=new Map();data.fases.forEach((r,i)=>{if(!groups.has(r.demand))groups.set(r.demand,[]);groups.get(r.demand).push({r,i})});
  for(const [id,rows] of groups){const demand=data.demandas.find(d=>d.id===id);for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length;b++){
   const x=rows[a],y=rows[b];if(x.r.start<=y.r.end&&y.r.start<=x.r.end)warnings.push(`Fases, linha ${x.i+2} e ${y.i+2}: sobreposição em ${demand.code||id} entre ${x.r.phase} (${SGP.fmt(x.r.start)} a ${SGP.fmt(x.r.end)}) e ${y.r.phase} (${SGP.fmt(y.r.start)} a ${SGP.fmt(y.r.end)}).`);
  }}
 }
 return {errors,warnings};
};
