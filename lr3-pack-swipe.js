(() => {
  const BUILD='LR3.6';
  let active=null,startX=0,startY=0,dragX=0;

  function isTopRevealCard(card){
    if(!card?.classList?.contains('lr216-reveal-card'))return false;
    const stack=card.closest('.lr216-reveal-stack');
    if(!stack||!stack.classList.contains('active'))return false;
    const cards=stack.querySelectorAll('.lr216-reveal-card');
    return cards.length>0&&cards[cards.length-1]===card;
  }
  function clearDrag(card){
    if(!card)return;
    card.style.transition='translate .16s ease, rotate .16s ease, opacity .16s ease';
    card.style.translate='0 0';
    card.style.rotate='0deg';
    card.style.opacity='';
    setTimeout(()=>{if(card.isConnected)card.style.transition='';},180);
  }
  function point(e,end=false){return (end?e.changedTouches?.[0]:e.touches?.[0])||e;}

  document.addEventListener('touchstart',e=>{
    const card=e.target.closest?.('.lr216-reveal-card');
    if(!isTopRevealCard(card))return;
    const p=point(e);active=card;startX=p.clientX;startY=p.clientY;dragX=0;
  },{capture:true,passive:true});

  document.addEventListener('touchmove',e=>{
    if(!active)return;
    const p=point(e),dx=p.clientX-startX,dy=p.clientY-startY;
    if(dx<=0||Math.abs(dx)<Math.abs(dy))return;
    dragX=dx;
    active.style.transition='none';
    active.style.translate=`${Math.min(dx,150)}px 0`;
    active.style.rotate=`${Math.min(10,dx/18)}deg`;
  },{capture:true,passive:true});

  document.addEventListener('touchend',e=>{
    if(!active)return;
    const card=active,p=point(e,true),dx=p.clientX-startX,dy=p.clientY-startY;
    active=null;
    const faceUp=card.querySelector('.flip-inner')?.classList.contains('faceup');
    const swipe=faceUp&&dx>=55&&Math.abs(dx)>Math.abs(dy)*1.1;
    if(!swipe){clearDrag(card);return;}
    e.preventDefault();
    e.stopPropagation();
    card.style.transition='none';
    const from=Math.max(0,dragX||dx);
    card.animate([
      {translate:`${from}px 0`,rotate:`${Math.min(10,from/18)}deg`,opacity:1},
      {translate:'115vw 0',rotate:'16deg',opacity:0}
    ],{duration:300,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
    card.click();
  },{capture:true,passive:false});

  document.addEventListener('touchcancel',()=>{clearDrag(active);active=null;},{capture:true,passive:true});
  window.LR3PackSwipe={build:BUILD};
})();
