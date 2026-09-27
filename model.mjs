export const sizes=['A7','A6','A5','A4','A3','A2','A1'];
export const materials=['Uncoated','Silk','Recycled','Kraft','Linen'];
export const designs=Array.from({length:9},(_,i)=>String(i+1));
export const tiers=[{min:1,factor:100},{min:10,factor:90},{min:25,factor:80},{min:50,factor:70}];
export function quote(size,material,design,quantity){
  const s=sizes.indexOf(size),m=materials.indexOf(material),d=designs.indexOf(String(design));
  if(Math.min(s,m,d)<0)throw new Error('Choose a valid variant.');
  if(!Number.isInteger(quantity)||quantity<1||quantity>10000)throw new Error('Quantity must be a whole number from 1 to 10,000.');
  const base=1000+s*200+m*100+d*50;
  const tier=tiers.filter(t=>quantity>=t.min).at(-1);
  const unit=Math.round(base*tier.factor/100);
  return {sku:`P-${s+1}-${m+1}-${d+1}`,base,unit,total:unit*quantity,tier:tier.min};
}
export function variantRows(){return sizes.flatMap(s=>materials.flatMap(m=>designs.map(d=>({size:s,material:m,design:d,...quote(s,m,d,1)}))));}
export function delimited(rows,separator=','){
  const cell=value=>{let s=String(value??'');if(/^[=+@\-\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return rows.map(row=>row.map(cell).join(separator)).join('\r\n');
}
export function variantReview(){return delimited([['SKU','Size','Material','Design count','Quantity from','Unit price USD'],...variantRows().flatMap(v=>tiers.map(t=>[v.sku,v.size,v.material,v.design,t.min,(quote(v.size,v.material,v.design,t.min).unit/100).toFixed(2)]))]);}
export function shopifyDraft(){return delimited([['URL handle','Title','Option1 name','Option1 value','Option2 name','Option2 value','Option3 name','Option3 value','SKU','Price','Status','Published on online store'],...variantRows().map(v=>['sample-print','Sample Print','Size',v.size,'Material',v.material,'Design count',v.design,v.sku,(v.base/100).toFixed(2),'draft','false'])]);}

export const reports={
  inventory:{label:'Inventory review',columns:['SKU','Warehouse','Units'],rows:[['DEMO-001','East, annex',42],['DEMO-002','West',17],['DEMO-003','North',0]]},
  aging:{label:'Order aging',columns:['Order','Age days','Status'],rows:[['DEMO-101',2,'Ready'],['DEMO-102',5,'Review'],['DEMO-103',1,'Pending']]}
};
export function reportFile(key,format){if(!reports[key])throw new Error('Unknown report.');const delimiter={csv:',',pipe:'|',tsv:'\t'}[format];if(!delimiter)throw new Error('Unknown format.');const r=reports[key];return delimited([r.columns,...r.rows],delimiter);}
export function reportConfig(key,format){reportFile(key,format);return `report: ${key}\nformat: ${format}\nquery_file: query.sql\nemail_enabled: false\nartifact_retention: 7 days\n# Select SCHEDULED_REPORT=${key} in a GitLab pipeline schedule.\n# Oracle, Vault, and email are not connected in this preview.\n`;}

export function callState(){return {seen:[],messages:[],stage:'waiting',issue:'',address:'',media:[],log:[]};}
export function missedCall(state,eventId='CALL-DEMO-001'){
  if(state.seen.includes(eventId)){state.log.push('Duplicate event skipped.');return state;}
  state.seen.push(eventId);
  if(state.stage==='stopped'){state.log.push('Suppressed: contact opted out.');return state;}
  state.stage='issue';state.messages.push({side:'business',text:'Sorry we missed you. What repair do you need help with? Reply STOP to opt out.'});state.log.push('Synthetic missed-call event accepted. Greeting preview created.');return state;
}
export function reply(state,input){
  const value=String(input).trim();if(!value||value.length>500)throw new Error('Enter 1–500 characters.');
  if(state.stage==='waiting')throw new Error('Simulate a missed call first.');
  if(state.stage==='stopped')throw new Error('Contact is opted out. Reset the demo to start again.');
  state.messages.push({side:'customer',text:value});
  if(/^(stop|unsubscribe|cancel|end|quit)$/i.test(value)){state.stage='stopped';state.messages.push({side:'business',text:'You are opted out. No further messages will be sent.'});state.log.push('Opt-out recorded. Future messages suppressed.');return state;}
  if(state.stage==='issue'){state.issue=value;state.stage='address';state.messages.push({side:'business',text:'Thanks. What is the service address? Use a fictional address in this demo.'});}
  else if(state.stage==='address'){state.address=value;state.stage='qualified';state.messages.push({side:'business',text:'Your details are ready for review. A production workflow would now share the approved booking link.'});state.log.push('Qualified lead ready. Booking link preview only.');}
  else {state.log.push('Additional customer message queued for human review.');}
  return state;
}
export function mediaAdded(state,name){if(state.stage==='waiting'||state.stage==='stopped')throw new Error('Start an active demo conversation first.');if(!state.media.includes(name))state.media.push(name);state.log.push('Image filename logged locally; no image uploaded.');}

export const prospects=[
  {id:'demo-1',name:'Pine Office Collective',domain:'pine.example.com',market:'Cary',sector:'office',signal:'New workspace opening',fresh:true,suppressed:false},
  {id:'demo-2',name:'Harbor Medical Suites',domain:'harbor.example.com',market:'Cary',sector:'medical',signal:'Facilities expansion',fresh:true,suppressed:false},
  {id:'demo-3',name:'Willow Retail Group',domain:'willow.example.com',market:'Cary',sector:'retail',signal:'Old listing only',fresh:false,suppressed:false},
  {id:'demo-4',name:'Coast Office Collective',domain:'coast.example.com',market:'Wilmington',sector:'office',signal:'New location',fresh:true,suppressed:false},
  {id:'demo-5',name:'Do Not Contact Demo',domain:'suppressed.example.com',market:'Cary',sector:'office',signal:'Suppression record',fresh:true,suppressed:true}
];
export const marketConfig={Cary:{sectorPoints:{office:35,medical:30,retail:15},locationPoints:35,freshPoints:30},Wilmington:{sectorPoints:{office:30,medical:35,retail:20},locationPoints:35,freshPoints:30}};
export function score(p,market){const c=marketConfig[market];if(!c)throw new Error('Unknown market.');const components={sector:c.sectorPoints[p.sector]??0,location:p.market===market?c.locationPoints:0,freshness:p.fresh?c.freshPoints:0};return {components,total:p.suppressed?0:Object.values(components).reduce((a,b)=>a+b,0)};}
export function approvalState(){return {decisions:{},audit:[]};}
export function decide(state,id,decision,note=''){
  const p=prospects.find(p=>p.id===id);if(!p)throw new Error('Unknown prospect.');
  if(!['approved','rejected','review'].includes(decision))throw new Error('Invalid decision.');
  if(p.suppressed&&decision==='approved')throw new Error('Suppressed contacts cannot be approved.');
  state.decisions[id]={decision,note:String(note).slice(0,300)};state.audit.unshift({id,decision,note:String(note).slice(0,300)});return state;
}
export function approvedCSV(state,market){
  const selected=prospects.filter(p=>p.market===market&&!p.suppressed&&state.decisions[p.id]?.decision==='approved');
  const seen=new Set();const rows=[];
  for(const p of selected){const key=p.domain.toLowerCase().replace(/^www\./,'');if(seen.has(key))continue;seen.add(key);rows.push([p.id,p.name,key,p.market,score(p,market).total,p.signal,state.decisions[p.id].note]);}
  return delimited([['ID','Company','Domain','Market','Score','Synthetic signal','Reviewer note'],...rows]);
}
