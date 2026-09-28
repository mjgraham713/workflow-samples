export const fresh = () => ({checkout:1,orders:{},sent:[],rawOrders:0,rawEvents:0,blocked:0,log:[]});
export function step(previous, action) {
  const s=structuredClone(previous);
  const log=(message)=>{s.log.unshift(message);s.log=s.log.slice(0,15);};
  if(action==='new'){s.checkout++;log('New checkout token: checkout-'+s.checkout);return s;}
  const token='checkout-'+s.checkout;
  if(action==='submit'||action==='back'){
    s.rawOrders++;
    if(!s.orders[token]){s.orders[token]='order-'+(5021+Object.keys(s.orders).length);log('Created '+s.orders[token]+'; simulated cart cleared.');}
    else{s.blocked++;log('Submission replay: reused '+s.orders[token]+'.');}
  }
  if(!s.orders[token]){log('No confirmed order. No Purchase event.');return s;}
  const id=s.orders[token];s.rawEvents++;
  if(s.sent.includes(id)){s.blocked++;log('Purchase suppressed: '+id+' already recorded.');}
  else{s.sent.push(id);log('Purchase recorded: '+id+' / USD 30.00.');}
  return s;
}
