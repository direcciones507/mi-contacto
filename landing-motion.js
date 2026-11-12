// Scroll-triggered entrances for sections and dynamically loaded directory cards.
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const hover=window.matchMedia('(hover: hover) and (pointer: fine)');
const selector='.reveal-item, #results .contact-card';
const reveal=el=>{el.classList.add('is-visible');el.classList.remove('mc-scroll-pending');};
if(!reduce.matches && 'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target);}
  },{threshold:0.06,rootMargin:'0px 0px -18px 0px'});
  const register=root=>{
    const nodes=[];
    if(root.nodeType===1&&root.matches(selector))nodes.push(root);
    if(root.querySelectorAll)nodes.push(...root.querySelectorAll(selector));
    for(const el of nodes){
      if(el.dataset.mcScrollObserved==='1')continue;
      el.dataset.mcScrollObserved='1';
      const rect=el.getBoundingClientRect();
      // Do not conceal content already above the viewport.
      if(rect.bottom<=0){reveal(el);continue;}
      el.classList.add('mc-scroll-pending');
      observer.observe(el);
    }
  };
  register(document);
  // Directory cards are inserted/replaced after API searches and pagination.
  const results=document.getElementById('results');
  if(results)new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)register(node);
  }).observe(results,{childList:true,subtree:true});
  // Never leave content hidden when navigating away or accessibility settings change.
  reduce.addEventListener?.('change',()=>{if(reduce.matches){observer.disconnect();document.querySelectorAll('.mc-scroll-pending').forEach(reveal);}});
}else document.querySelectorAll(selector).forEach(reveal);
const card=document.getElementById('motionPreview');
if(card && hover.matches && !reduce.matches){
  card.addEventListener('pointermove',event=>{
    const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
    card.style.setProperty('--mc-tilt-x',(-y*7).toFixed(2)+'deg');
    card.style.setProperty('--mc-tilt-y',(x*7).toFixed(2)+'deg');
  },{passive:true});
  card.addEventListener('pointerleave',()=>{
    card.style.setProperty('--mc-tilt-x','0deg');card.style.setProperty('--mc-tilt-y','0deg');
  });
}
