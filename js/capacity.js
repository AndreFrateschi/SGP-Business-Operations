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
