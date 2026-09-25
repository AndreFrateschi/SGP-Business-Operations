const typeGuidance=(type,label)=>type?.startsWith('date')?'Data em AAAA-MM-DD (ex.: 2026-09-25).':type?.startsWith('number')?'Número não negativo (ex.: 160).':type==='percent'?'Percentual de 0 a 100 (ex.: 75).':`Texto para ${label}; preserve IDs e nomes das opções.`;
SGP.excelGuidance={id:'ID único; não duplique e mantenha as referências nas outras abas.',demand:'ID da demanda existente.',person:'ID da pessoa existente.',front:'Use uma frente válida da lista na aba LEIA-ME.',status:'Use um status válido da lista na aba LEIA-ME.',phase:'Use uma fase válida da lista na aba LEIA-ME.',risk:'Use Nenhum, Baixa, Média, Alta ou Crítica.',type:'Use Projeto, Proposta, Melhoria, Evolução, Ticket N3 ou Outro.',active:'Use Sim ou Não.',hours:'Horas totais do intervalo; número não negativo.',capacity:'Capacidade mensal em horas; número não negativo.',percent:'Percentual informativo de 0 a 100.',code:'Código curto e único da demanda (ex.: P001).'};
SGP.workbook=data=>{
 const wb=XLSX.utils.book_new();for(const [key,schema] of Object.entries(SGP.schemas)){
  const rows=[schema.map(([,label])=>label),...data[key].map(r=>schema.map(([field])=>r[field]??''))];
  const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=schema.map(([,label])=>({wch:Math.min(35,Math.max(17,label.length+2))}));ws['!autofilter']={ref:ws['!ref']};XLSX.utils.book_append_sheet(wb,ws,SGP.sheetNames[key]);
 }
 const instructions=[['SGP | Business Operations — modelo Excel'],['Como preencher','Use uma linha por registro. Não altere os nomes das abas nem os cabeçalhos. Campos com * são obrigatórios. Datas preferencialmente em AAAA-MM-DD.'],['Legenda','Exemplo mostra o tipo de valor esperado; listas devem usar exatamente uma das opções indicadas.'],['Datas','AAAA-MM-DD como texto, ou células de data do Excel.'],['IDs','IDs únicos em Demandas e Pessoas; referências exatas nas outras abas. Não renomeie IDs em apenas uma aba.'],['Importação','Substitui toda a base somente depois da pré-validação e confirmação. Abas vazias são permitidas com cabeçalhos.'],['Frentes',SGP.fronts.join('; ')],['Status',SGP.statuses.join('; ')],['Fases',SGP.stages.join('; ')],['Risco','Nenhum; Baixa; Média; Alta; Crítica'],['Tipo','Projeto; Proposta; Melhoria; Evolução; Ticket N3; Outro'],['Função','Tech Leader; Analista; Desenvolvedor; PMO; Plan; Business Operations; Outro'],['Ativo','Sim; Não'],['Capacidade','Capacidade mensal em horas, proporcional aos dias corridos do mês. Horas alocadas são totais do intervalo, distribuídas uniformemente pelos dias corridos. Feriados não são descontados. Percentual é informativo; Horas alimenta a capacidade.'],['Marcos','Marcos cadastrados prevalecem sobre datas equivalentes da demanda. Entrega técnica e final são também consideradas quando não houver marco equivalente.'],['Segurança','Somente dados fictícios neste modelo. Cópias Excel são sua responsabilidade; armazenamento local não sincroniza computadores.'],...Object.entries(SGP.schemas).flatMap(([key,schema])=>{const rows=[[SGP.sheetNames[key]+' — instruções por coluna','Campo','Obrigatório','Exemplo / orientação']];return [rows,...schema.map(([field,label,type])=>[label,field,(type==='required'||type?.endsWith('!'))?'Sim':'Não',SGP.excelGuidance?.[field]||typeGuidance(type,label)])]}),...Object.entries(SGP.schemas).map(([key,schema])=>[SGP.sheetNames[key]+' — obrigatórios',schema.filter(([, ,t])=>t==='required'||t?.endsWith('!')).map(([,l])=>l).join('; ')])];
 const readme=XLSX.utils.aoa_to_sheet(instructions);readme['!cols']=[{wch:34},{wch:24},{wch:14},{wch:95}];XLSX.utils.book_append_sheet(wb,readme,'LEIA-ME');return wb;
};
SGP.parseWorkbook=wb=>{
 const data=SGP.empty(),structure=[];
 for(const [key,schema] of Object.entries(SGP.schemas)){
  const ws=wb.Sheets[SGP.sheetNames[key]];if(!ws){structure.push(`Aba obrigatória ausente: ${SGP.sheetNames[key]}`);continue}
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true}),headers=(rows.shift()||[]).map(v=>String(v).trim());
  schema.forEach(([,label])=>{if(!headers.includes(label))structure.push(`${SGP.sheetNames[key]}: coluna ausente ${label}`);if(headers.filter(h=>h===label).length>1)structure.push(`${SGP.sheetNames[key]}: coluna duplicada ${label}`)});
  data[key]=rows.filter(row=>row.some(v=>v!=='')).map(row=>Object.fromEntries(schema.map(([f,label,type])=>{
   let v=row[headers.indexOf(label)]??'';
   if(type?.startsWith('date')&&v!==''){
    if(v instanceof Date)v=SGP.iso(v);else if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v,{date1904:!!wb.Workbook?.WBProps?.date1904});v=d?`${String(d.y).padStart(4,'0')}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`:String(v)}else{v=String(v).trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(v))v=v.split('/').reverse().join('-')}
   }else if(type?.startsWith('number')||type==='percent'){v=v===''?'':typeof v==='number'?v:Number(String(v).replace(',','.'))}else v=String(v).trim();return [f,v];
  })));
 }
 const result=SGP.validate(data);result.errors.unshift(...structure);return {data,...result};
};
SGP.download=(name,content,type)=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
SGP.exportExcel=(data,name='SGP-Business-Operations.xlsx')=>XLSX.writeFile(SGP.workbook(data),name,{compression:true});
