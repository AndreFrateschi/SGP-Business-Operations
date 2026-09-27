SGP.capacity=(data,start,end,demands=data.demandas)=>{
 const ids=new Set(demands.map(d=>d.id));
 return data.pessoas.filter(p=>p.active==='Sim').map(p=>{
  let available=0;for(let c=start;c<=end;c=SGP.add(c,1)){const dt=SGP.date(c),days=new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,0)).getUTCDate();available+=Number(p.capacity)/days}
  const allocations=data.alocacoes.filter(a=>a.person===p.id&&ids.has(a.demand)&&a.start<=end&&a.end>=start);
  const hours=allocations.reduce((sum,a)=>sum+Number(a.hours)*SGP.days(a.start>start?a.start:start,a.end<end?a.end:end)/SGP.days(a.start,a.end),0);
  let conflict=false,overlap=false;
  const events=new Map();
  allocations.forEach(a=>{const s=a.start>start?a.start:start,e=a.end<end?a.end:end,daily=Number(a.hours)/SGP.days(a.start,a.end);events.set(s,(events.get(s)||0)+daily);const next=SGP.add(e,1);events.set(next,(events.get(next)||0)-daily)});
  let daily=0;for(let c=start;c<=end;c=SGP.add(c,1)){daily+=events.get(c)||0;const dt=SGP.date(c),days=new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,0)).getUTCDate();if(daily>Number(p.capacity)/days+.001)conflict=true}
  const sorted=[...allocations].sort((a,b)=>a.start.localeCompare(b.start));let last='';for(const a of sorted){if(a.start<=last)overlap=true;if(a.end>last)last=a.end}
  return {...p,available,hours,util:available?hours/available*100:hours?Infinity:0,conflict,overlap,allocations};
 });
};
SGP.allocationPercent=(data,allocation)=>{
 const person=data.pessoas.find(p=>p.id===allocation.person),hours=Number(allocation.hours);
 if(!person||!SGP.validDate(allocation.start)||!SGP.validDate(allocation.end)||allocation.end<allocation.start||!Number.isFinite(hours)||hours<0)return null;
 let available=0;for(let day=allocation.start;day<=allocation.end;day=SGP.add(day,1)){const date=SGP.date(day),daysInMonth=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();available+=Number(person.capacity)/daysInMonth}
 return available>0?hours/available*100:null;
};
SGP.frontCapacity=rows=>SGP.fronts.map(front=>{const group=rows.filter(p=>p.front===front),available=group.reduce((s,p)=>s+p.available,0),hours=group.reduce((s,p)=>s+p.hours,0);return {front,people:group.length,available,hours,util:available?hours/available*100:hours?Infinity:0}});
