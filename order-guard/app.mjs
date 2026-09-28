import {fresh,step} from './model.mjs';
const key='fieldwork-order-guard-v1';let state=fresh();const $=id=>document.getElementById(id);
try{const saved=JSON.parse(sessionStorage.getItem(key));if(saved && typeof saved.checkout==='number' && saved.orders && Array.isArray(saved.sent) && Array.isArray(saved.log)){state=saved;}}catch{$('error').textContent='Storage unavailable. This demonstration will run in memory.';}
function render(){
  $('orders').textContent=Object.keys(state.orders).length;$('purchases').textContent=state.sent.length;$('raw-orders').textContent=state.rawOrders;$('raw-events').textContent=state.rawEvents;$('blocked').textContent=state.blocked;
  const id=state.orders['checkout-'+state.checkout];$('status').textContent=id?`Confirmed ${id}. Cart empty. Repeat this submission or start a genuinely new checkout.`:`Checkout ${state.checkout} · one sample item · $30. Ready to submit.`;
  $('log').replaceChildren(...state.log.map(message=>{const li=document.createElement('li');li.textContent=message;return li;}));
  try{sessionStorage.setItem(key,JSON.stringify(state));}catch{$('error').textContent='Storage unavailable. State will reset on reload.';}
}
for(const action of ['submit','refresh','back','new']){$(action).addEventListener('click',()=>{state=step(state,action);render();});}
$('reset').addEventListener('click',()=>{state=fresh();render();});render();
