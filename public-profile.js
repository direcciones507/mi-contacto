const button=document.getElementById('shareProfile');
button?.addEventListener('click',async()=>{const status=document.getElementById('shareStatus');try{const url=location.origin+location.pathname;if(navigator.share)await navigator.share({title:document.title,url});else{await navigator.clipboard.writeText(url);status.textContent='Enlace copiado.';}}catch(e){if(e.name!=='AbortError')status.textContent='Puedes copiar el enlace de esta página para compartirlo.';}});

const photoDialog=document.getElementById('profilePhotoDialog');
const expandedPhoto=document.getElementById('expandedProfilePhoto');
const photoButtons=[...document.querySelectorAll('.profile-photo-open')];
let activePhoto=0,photoTimer=null,touchStartX=null,suppressNextClick=false;
function stopPhotoTimer(){if(photoTimer!==null){clearInterval(photoTimer);photoTimer=null;}}
function showPhoto(index){
 if(!expandedPhoto||!photoButtons.length)return;
 activePhoto=(index+photoButtons.length)%photoButtons.length;
 const source=photoButtons[activePhoto];
 expandedPhoto.classList.remove('mc-photo-enter');
 void expandedPhoto.offsetWidth;
 expandedPhoto.src=source.dataset.photoUrl;
 expandedPhoto.alt=source.querySelector('img')?.alt||'Fotografía ampliada';
 expandedPhoto.classList.add('mc-photo-enter');
 const count=photoDialog?.querySelector('.mc-photo-counter');
 if(count)count.textContent=(activePhoto+1)+' / '+photoButtons.length;
 photoDialog?.querySelectorAll('.mc-story-progress-segment').forEach((segment,i)=>{segment.classList.toggle('is-complete',i<activePhoto);segment.classList.toggle('is-current',i===activePhoto);const fill=segment.querySelector('span');if(fill){fill.style.animation='none';void fill.offsetWidth;fill.style.animation='';}});
}
function startPhotoTimer(){
 stopPhotoTimer();
 if(photoButtons.length>1&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  photoTimer=setInterval(()=>{if(photoDialog?.open&&!document.hidden)showPhoto(activePhoto+1);},4500);
}
if(photoDialog&&expandedPhoto&&photoButtons.length){
 const progress=document.createElement('div');progress.className='mc-story-progress';progress.setAttribute('aria-label','Progreso de fotografías');
 photoButtons.forEach((_,i)=>{const segment=document.createElement('button');segment.type='button';segment.className='mc-story-progress-segment';segment.setAttribute('aria-label','Ver fotografía '+(i+1));const fill=document.createElement('span');segment.append(fill);segment.addEventListener('click',()=>{showPhoto(i);startPhotoTimer();});progress.append(segment);});
 photoDialog.prepend(progress);
 const controls=document.createElement('div');
 controls.className='mc-photo-controls';
 const previous=document.createElement('button');
 previous.type='button';previous.className='mc-photo-prev';previous.textContent='‹';previous.setAttribute('aria-label','Fotografía anterior');
 const count=document.createElement('span');count.className='mc-photo-counter';count.setAttribute('aria-live','polite');
 const next=document.createElement('button');
 next.type='button';next.className='mc-photo-next';next.textContent='›';next.setAttribute('aria-label','Fotografía siguiente');
 controls.append(previous,count,next);
 photoDialog.append(controls);
 const advance=delta=>{showPhoto(activePhoto+delta);startPhotoTimer();};
 previous.addEventListener('click',()=>advance(-1));
 next.addEventListener('click',()=>advance(1));
 expandedPhoto.addEventListener('click',()=>{if(suppressNextClick){suppressNextClick=false;return;}advance(1);});
 expandedPhoto.style.cursor=photoButtons.length>1?'pointer':'default';
 photoButtons.forEach((button,index)=>button.addEventListener('click',()=>{
  showPhoto(index);if(!photoDialog.open)photoDialog.showModal();startPhotoTimer();
 }));
 photoDialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'){event.preventDefault();advance(1);}
  if(event.key==='ArrowLeft'){event.preventDefault();advance(-1);}
 });
 expandedPhoto.addEventListener('touchstart',event=>{touchStartX=event.touches[0]?.clientX??null;},{passive:true});
 expandedPhoto.addEventListener('touchend',event=>{if(touchStartX===null)return;const delta=(event.changedTouches[0]?.clientX??touchStartX)-touchStartX;touchStartX=null;if(Math.abs(delta)>45){advance(delta<0?1:-1);suppressNextClick=true;}},{passive:true});
 // Do not pause on desktop hover: the progress line remains continuous.

 photoDialog.addEventListener('close',stopPhotoTimer);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPhotoTimer();else if(photoDialog.open)startPhotoTimer();});
}
document.getElementById('closeProfilePhoto')?.addEventListener('click',()=>photoDialog?.close());
photoDialog?.addEventListener('click',event=>{if(event.target===photoDialog)photoDialog.close();});
