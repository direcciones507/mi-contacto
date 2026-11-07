const button=document.getElementById('shareProfile');
button?.addEventListener('click',async()=>{const status=document.getElementById('shareStatus');try{const url=location.origin+location.pathname;if(navigator.share)await navigator.share({title:document.title,url});else{await navigator.clipboard.writeText(url);status.textContent='Enlace copiado.';}}catch(e){if(e.name!=='AbortError')status.textContent='Puedes copiar el enlace de esta página para compartirlo.';}});

const photoDialog=document.getElementById('profilePhotoDialog');
const expandedPhoto=document.getElementById('expandedProfilePhoto');
document.querySelectorAll('.profile-photo-open').forEach(button=>button.addEventListener('click',()=>{
 if(!photoDialog||!expandedPhoto)return;
 expandedPhoto.src=button.dataset.photoUrl;
 photoDialog.showModal();
}));
document.getElementById('closeProfilePhoto')?.addEventListener('click',()=>photoDialog?.close());
photoDialog?.addEventListener('click',event=>{if(event.target===photoDialog)photoDialog.close();});
