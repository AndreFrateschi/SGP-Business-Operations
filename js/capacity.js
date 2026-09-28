// UTC dates avoid timezone and daylight-saving shifts. Weekends have no capacity.
SGP.isWorkday=day=>{const weekday=SGP.date(day).getUTCDay();return weekday!==0&&weekday!==6};
SGP.workdays=(start,end)=>{
 if(!SGP.validDate(start)||!SGP.validDate(end)||end<start)return 0;
 const days=SGP.days(start,end),weeks=Math.floor(days/7);let total=weeks*5;
 for(let i=weeks*7;i<days;i++)if(SGP.isWorkday(SGP.add(start,i)))total++;
 return total;
};
SGP.capacity=(data,start,end,demands=data.demandas)=>{
 const ids=new Set(demands.map(d=>d.id)),available=SGP.workdays(start,end)*8;
 return data.pessoas.filter(p=>p.active==='Sim').map(p=>{
  const allocations=data.alocacoes.filter(a=>a.person===p.id&&ids.has(a.demand)&&a.start<=end&&a.end>=start);
  let hours=0,conflict=false,overlap=false;const events=new Map();
  allocations.forEach(a=>{
   const days=SGP.workdays(a.start,a.end),s=a.start>start?a.start:start,e=a.end<end?a.end:end;
   if(!days)return; // Invalid legacy weekend-only rows are reported by validation.
   const daily=Number(a.hours)/days;hours+=daily*SGP.workdays(s,e);
   const add=(date,sign)=>{const event=events.get(date)||[0,0];event[0]+=daily*sign;event[1]+=sign;events.set(date,event)};
   add(s,1);add(SGP.add(e,1),-1);
  });
  let daily=0,count=0;for(let day=start;day<=end;day=SGP.add(day,1)){
   const event=events.get(day);if(event){daily+=event[0];count+=event[1]}
   if(SGP.isWorkday(day)){if(daily>8+.001)conflict=true;if(count>1)overlap=true}
  }
  return {...p,available,hours,util:available?hours/available*100:0,conflict,overlap,allocations};
 });
};
SGP.allocationPercent=(data,allocation)=>{
 const person=data.pessoas.find(p=>p.id===allocation.person),hours=Number(allocation.hours);
 if(!person||!Number.isFinite(hours)||hours<0)return null;
 const available=SGP.workdays(allocation.start,allocation.end)*8;
 return available>0?hours/available*100:null;
};
SGP.frontCapacity=rows=>SGP.fronts.map(front=>{const group=rows.filter(p=>p.front===front),available=group.reduce((s,p)=>s+p.available,0),hours=group.reduce((s,p)=>s+p.hours,0);return {front,people:group.length,available,hours,util:available?hours/available*100:hours?Infinity:0}});
// Coverage is planned effort, never actual hours worked. Allocation remains demand-level.
SGP.coverage=(data,d,start='',end='')=>{
 const period=!!(start&&end),phases=data.fases.filter(p=>p.demand===d.id),budget=SGP.phaseBudget(data,d.id);
 const share=(hours,a,b)=>{const days=SGP.workdays(a,b);return days?Number(hours||0)*SGP.workdays(period&&start>a?start:a,period&&end<b?end:b)/days:0};
 const incomplete=budget.unclassified>0||Math.abs(budget.remaining)>.001||phases.some(p=>p.budget==='Sim'&&Number(p.plannedHours)>0&&!SGP.workdays(p.start,p.end));
 const required=period?phases.filter(p=>p.budget==='Sim').reduce((sum,p)=>sum+share(p.plannedHours,p.start,p.end),0):Math.max(Number(d.estimated)||0,budget.planned);
 const allocations=data.alocacoes.filter(a=>a.demand===d.id),active=new Set(data.pessoas.filter(p=>p.active==='Sim').map(p=>p.id));
 const allocated=allocations.filter(a=>active.has(a.person)).reduce((sum,a)=>sum+share(a.hours,a.start,a.end),0);
 const dates=allocations.flatMap(a=>[a.start,a.end]).filter(SGP.validDate).sort(),from=period?start:dates[0],to=period?end:dates.at(-1);
 const people=new Set(allocations.filter(a=>share(a.hours,a.start,a.end)>0).map(a=>a.person));
 const overloaded=from&&to?SGP.capacity(data,from,to).filter(p=>people.has(p.id)&&p.conflict).map(p=>p.name):[];
 const notes=[];if(incomplete)notes.push('Planejamento incompleto ou divergente');if(allocations.some(a=>!active.has(a.person)))notes.push('Alocações de pessoas inativas não contabilizadas');if(allocations.some(a=>Number(a.hours)>0&&!SGP.workdays(a.start,a.end)))notes.push('Alocação sem dias úteis');
 return {required,allocated,missing:Math.max(0,required-allocated),excess:Math.max(0,allocated-required),percent:required>0?allocated/required*100:null,overloaded,notes,incomplete};
};
