window.SGP = {};
Object.assign(SGP, {
 fronts:['Produção','Qualidade','Torque','Automação Industrial','Inovação IoT'],
 colors:['#2489ec','#20b985','#f3873e','#8859df','#ec5268'],
 stages:['Entrada','Levantamento','Proposta','Aprovação','Planejamento','Desenvolvimento','Homologação','Implantação','Fechamento','Concluído','Aguardando Cliente'],
 statuses:['Não iniciado','Em andamento','Aguardando cliente','Aguardando aprovação','Bloqueado','Em risco','Concluído','Cancelado'],
 phaseColors:['#9eaec0','#7d94ac','#a1a7c5','#ddae41','#a8b7c6','#339bed','#a28ae7','#36bd8d','#318c83','#25986b','#edb737'],
 esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 iso:d=>new Date(d).toISOString().slice(0,10),
 date:s=>new Date(s+'T00:00:00Z'),
 today:()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},
 add:(s,n)=>new Date(new Date(s+'T00:00:00Z').getTime()+n*86400000).toISOString().slice(0,10),
 days:(a,b)=>Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000)+1,
 fmt:s=>s?String(s).split('-').reverse().slice(0,2).join('/'):'—',
 validDate:s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s,
 uid:()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now()+'-'+Math.random().toString(36).slice(2)
});
SGP.schemas={
 demandas:[['id','ID','required'],['code','Código','required'],['name','Nome da Demanda','required'],['description','Descrição resumida'],['type','Tipo','required'],['front','Frente','required'],['plan','Plan'],['pmo','PMO'],['leader','Tech Leader'],['bo','Responsável BO'],['phase','Fase Atual','required'],['status','Status','required'],['entry','Data de Entrada','date'],['start','Data Início','date!'],['technical','Data Entrega Técnica','date'],['homologation','Data Homologação','date'],['deployment','Data Implantação','date'],['end','Data Final Prevista','date!'],['estimated','Horas Estimadas','number'],['consumed','Horas Consumidas','number'],['progress','Percentual de Conclusão','percent'],['next','Próximo Marco'],['nextDate','Data Próximo Marco','date'],['dependency','Dependência'],['dependencyOwner','Responsável pela Dependência'],['risk','Risco'],['riskDescription','Descrição do Risco'],['git','Link Git'],['notes','Observação']],
 pessoas:[['id','ID','required'],['name','Nome','required'],['role','Função','required'],['front','Frente Principal','required'],['leader','Tech Leader'],['capacity','Capacidade Mensal','number!'],['active','Ativo','required']],
 alocacoes:[['person','Pessoa ID','required'],['demand','Demanda ID','required'],['start','Data Início','date!'],['end','Data Fim','date!'],['hours','Horas','number!'],['percent','Percentual','percent']],
 fases:[['demand','Demanda ID','required'],['phase','Fase','required'],['start','Data Início','date!'],['end','Data Fim','date!'],['status','Status','required']],
 marcos:[['demand','Demanda ID','required'],['name','Marco','required'],['date','Data','date!'],['status','Status','required'],['notes','Observação']]
};
SGP.sheetNames={demandas:'Demandas',pessoas:'Pessoas',alocacoes:'Alocacoes',fases:'Fases',marcos:'Marcos'};
