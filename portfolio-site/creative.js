// Progressive enhancement for the Creative Library. Links work without JavaScript.
(()=>{
const host=document.getElementById('creative');
if(!host)return;
const filters=[...host.querySelectorAll('.creative-filters button')];
const cards=[...host.querySelectorAll('.creative-card')];
const counter=host.querySelector('#creative-count');
const noun=n=>String(n).padStart(2,'0')+(n===1?' COLLECTION':' COLLECTIONS');
filters.forEach(button=>button.addEventListener('click',()=>{
 const category=button.dataset.filter;
 filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 let shown=0;
 cards.forEach(card=>{
   const isVisible=category==='all'||(card.dataset.category||'').split(/\s+/).includes(category);
   card.hidden=!isVisible;
   if(isVisible)shown++;
 });
 counter.textContent=noun(shown);
}));
})();
