import './directory-client.js?v=20261112-motion4';

let comingSoonTimer;function showComingSoon(){const notice=document.getElementById('comingSoonNotice');if(!notice)return;clearTimeout(comingSoonTimer);notice.classList.add('visible');comingSoonTimer=setTimeout(()=>notice.classList.remove('visible'),3000);}
document.querySelectorAll('[data-coming-soon]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();showComingSoon();}));
