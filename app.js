/* Viewport-relative presentation. Native scrolling and content order are unchanged. */
(()=>{
 const root=document.documentElement,header=document.querySelector('.site-header');
 const portrait=document.querySelector('.portrait-view'),photo=portrait?.querySelector('img[data-full-src]');
 // Keep the supplied original intact; fetch it only when the visitor opens the photograph.
 portrait?.addEventListener('toggle',()=>{
  if(portrait.open&&photo?.dataset.fullSrc){photo.removeAttribute('srcset');photo.src=photo.dataset.fullSrc;delete photo.dataset.fullSrc;}
 });
 const credits=document.querySelector('#image-credits');
 const revealCredits=()=>{if(credits&&location.hash==='#image-credits')credits.open=true};
 // Open the native disclosure before the browser follows its in-page anchor.
 document.addEventListener('click',event=>{
  if(event.target instanceof Element&&event.target.closest('a[href="#image-credits"]')&&credits)credits.open=true;
 });
 addEventListener('hashchange',revealCredits);revealCredits();
 // Screenshots open in a modal viewer; without dialog support the link opens the image itself.
 const viewer=document.createElement('dialog');viewer.className='lightbox';viewer.setAttribute('aria-label','Full-size image');
 viewer.innerHTML='<div class="lightbox-bar"><span class="lightbox-hint">Swipe to pan</span><a class="lightbox-original" target="_blank" rel="noopener">Open original</a><button type="button" class="lightbox-close">Close</button></div><div class="lightbox-frame"><img alt=""></div>';
 const viewerImage=viewer.querySelector('img'),viewerOriginal=viewer.querySelector('.lightbox-original'),viewerFrame=viewer.querySelector('.lightbox-frame');
 if(viewer.showModal){
  document.body.append(viewer);
  document.addEventListener('click',event=>{
   const link=event.target instanceof Element&&event.target.closest('a.image-zoom,.demo-walkthrough a[href$=".webp"]');
   if(!link)return;
   event.preventDefault();
   viewerImage.src=viewerOriginal.href=link.href;viewerImage.alt=link.querySelector('img')?.alt||'';
   viewer.showModal();viewerFrame.scrollLeft=0;root.classList.add('lightbox-open');
  });
  // The backdrop, the image and the button all close the viewer.
  viewer.addEventListener('click',event=>{if(event.target===viewer||event.target===viewerFrame||event.target===viewerImage||event.target.closest('.lightbox-close'))viewer.close()});
  viewer.addEventListener('close',()=>{root.classList.remove('lightbox-open');viewerImage.removeAttribute('src')});
 }
 const sections=[...document.querySelectorAll('main>section')],links=[...document.querySelectorAll('.site-header nav a')];
 // Phones: scrolling down tucks the wordmark row away and keeps the navigation row visible.
 const phone=matchMedia('(max-width:760px) and (min-height:501px)'),wordmark=header.querySelector('.wordmark'),headerNav=header.querySelector('nav');
 let lastY=scrollY;
 const setCompact=on=>root.classList.toggle('header-compact',on&&phone.matches);
 document.addEventListener('click',event=>{
  const link=event.target instanceof Element&&event.target.closest('a[href^="#"]'),target=link&&document.getElementById(link.hash.slice(1));
  // Match the header to the jump direction so scroll padding fits the header that will be shown.
  if(target)setCompact(target.getBoundingClientRect().top>header.getBoundingClientRect().bottom);
 });
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),wide=matchMedia('(min-width:1000px) and (min-height:650px)');
 const scenes=[...document.querySelectorAll('.project-row')];
 for(const step of document.querySelectorAll('.story-step')){const content=document.createElement('div');content.className='story-content';while(step.firstChild)content.append(step.firstChild);step.append(content)}
 const clamp=n=>Math.max(0,Math.min(1,n));const ease=n=>n*n*(3-2*n);let frame=0;
 function update(){
  frame=0;
  try{
   const enabled=!reduced.matches,sticky=enabled&&wide.matches;
   root.classList.toggle('story-motion',sticky);
   const delta=scrollY-lastY;
   if(scrollY<header.offsetHeight||document.activeElement===wordmark)setCompact(false);else if(Math.abs(delta)>6)setCompact(delta>0);
   if(Math.abs(delta)>6||scrollY<header.offsetHeight)lastY=scrollY;
   // Short viewports let the header scroll away; never measure above the viewport.
   const boundary=Math.max(0,header.getBoundingClientRect().bottom);
   let current=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<=boundary+160)current=s;
   if(scrollY+innerHeight>=document.documentElement.scrollHeight-3)current=sections.at(-1);
   for(const a of links)a.hash==='#'+(current.dataset.nav||current.id)?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current');
   for(const row of scenes){
    const figure=row.querySelector('.project-visual'),anchor=sticky?row:figure;
    // The image and inner text move; the measured row/figure/step stays in document flow.
    const open=ease(clamp((innerHeight*.88-anchor.getBoundingClientRect().top)/(innerHeight*.62)));
    row.style.setProperty('--scene-scale',String(.76+.24*open));
    row.style.setProperty('--scene-angle',(-2*(1-open))+'deg');
    row.style.setProperty('--image-lift',(44*(1-open))+'px');
    row.style.setProperty('--scene-lift','0px');
    row.style.setProperty('--plate-x',(-24*(1-open))+'px');row.style.setProperty('--plate-y',(18*(1-open))+'px');row.style.setProperty('--plate-angle',(4*(1-open))+'deg');
    for(const step of row.querySelectorAll('.story-step')){
     const rect=step.getBoundingClientRect();
     const entry=ease(clamp((innerHeight*.9-rect.top)/(innerHeight*.48)));
     step.style.setProperty('--entry-opacity',String(entry));step.style.setProperty('--entry-lift',(64*(1-entry))+'px');
     step.classList.toggle('is-current',rect.top<innerHeight*.65&&rect.bottom>boundary+60);
    }
   }
   // Only enable presentation after a successful measurement; no-JS/error fallback stays readable.
   root.classList.toggle('motion-enabled',enabled);
  }catch(error){root.classList.remove('motion-enabled','story-motion');console.error(error)}
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
 const measure=()=>{
  root.style.setProperty('--header-height',header.offsetHeight+'px');
  root.style.setProperty('--header-shift',Math.max(0,headerNav.offsetTop-6)+'px');
  if(!phone.matches)setCompact(false);
 };
 const resize=()=>{measure();schedule()};
 // Establish the desktop story layout before native initial fragment positioning.
 measure();update();
 new ResizeObserver(resize).observe(header);addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});
 reduced.addEventListener('change',schedule);wide.addEventListener('change',schedule);phone.addEventListener('change',resize);document.addEventListener('focusin',schedule);document.fonts?.ready.then(schedule);
})();
