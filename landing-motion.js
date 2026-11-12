// Progressive entrance and interactive demo tilt, scoped to the public landing only.
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const hover=window.matchMedia('(hover: hover) and (pointer: fine)');
const elements=[...document.querySelectorAll('.reveal-item')];
if(!reduce.matches && 'IntersectionObserver' in window){
  document.documentElement.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
  elements.forEach(el=>observer.observe(el));
}else elements.forEach(el=>el.classList.add('is-visible'));
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
