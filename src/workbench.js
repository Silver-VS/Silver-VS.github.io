const destinations = [
  ['Overview','/'],['Work','/work/'],['Notebook','/notebook/'],['Lab','/lab/'],['About','/about/'],
  ['Uses','/uses/'],['Archive','/archive/'],['Repositories','/repositories/'],['Fields','/fields/'],['GitHub','https://github.com/Silver-VS']
].map(([title,url])=>({title,url,kind:'go to',id:'',fields:[],technologies:[],text:'',summary:''}));

export function searchNodes(nodes, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return nodes.filter(n => {
    const searchable = [n.id,n.title,n.summary,n.kind,...n.fields,...n.technologies,n.text].join(' ').toLowerCase();
    return terms.every(term => {
      if(term.startsWith('field:')) return n.fields.some(f=>f.toLowerCase().includes(term.slice(6)));
      if(term.startsWith('tech:')) return n.technologies.some(t=>t.toLowerCase().includes(term.slice(5)));
      return searchable.includes(term);
    });
  }).sort((a,b) => {
    const score = n => (terms.some(t=>n.id.toLowerCase()===t) ? 4 : 0)+(terms.every(t=>n.title.toLowerCase().includes(t)) ? 2 : 0);
    return score(b)-score(a);
  });
}

export function matchesFilters(record, {state='all',field='all',year='all'}) {
  return (state==='all'||record.state===state) && (field==='all'||record.fields.split(' ').includes(field)) && (year==='all'||record.year===year);
}

if(typeof document !== 'undefined') {
  const palette = document.querySelector('.palette');
  const drawer = document.querySelector('.nav-dialog');
  const query = document.querySelector('#palette-query');
  const results = document.querySelector('#palette-results');
  const status = document.querySelector('#palette-status');
  let indexPromise, selected=-1, resultLinks=[];
  function getIndex() {
    // Keep a rejected request retryable instead of permanently disabling search after a transient failure.
    if(!indexPromise) indexPromise=fetch('/src/search-index.json').then(r=>{if(!r.ok)throw new Error(`Search index HTTP ${r.status}`);return r.json();}).catch(error=>{indexPromise=undefined;console.error('[workbench:search]',error);throw error;});
    return indexPromise;
  }
  function resultElement(n) {
    const a=document.createElement('a');a.className='search-result';a.href=n.url;
    const id=document.createElement('span');id.className='node-id';id.textContent=n.id||'→';
    const body=document.createElement('span');const title=document.createElement('strong');title.textContent=n.title;body.append(title);
    if(n.summary){const summary=document.createElement('small');summary.textContent=n.summary;body.append(summary);}
    const kind=document.createElement('span');kind.className='mono dim';kind.textContent=n.kind.toUpperCase();
    a.append(id,body,kind);return a;
  }
  function paint(container, matches, groups=false) {
    container.replaceChildren();
    if(!matches.length){const p=document.createElement('p');p.className='empty';p.textContent='No matching nodes. Try a title, ID, field, or technology.';container.append(p);return;}
    const kinds=groups ? ['work','notebook','lab','go to'] : ['all'];
    for(const kind of kinds){const items=kind==='all'?matches:matches.filter(n=>n.kind===kind);if(!items.length)continue;
      if(groups){const h=document.createElement('h3');h.textContent=kind;container.append(h);}
      for(const n of items)container.append(resultElement(n));
    }
  }
  async function updatePalette() {
    const requested=query.value;
    try {
      const nodes=await getIndex();
      if(query.value!==requested)return;
      const matches=searchNodes([...nodes,...destinations],requested).slice(0,30);
      paint(results,matches,true);status.textContent=`${matches.length} results.`;
      resultLinks=[...results.querySelectorAll('a')];selected=-1;
    } catch(error) {results.replaceChildren();const p=document.createElement('p');p.className='empty';p.textContent='Search could not load. Browse the archive or try again.';const a=document.createElement('a');a.href='/archive/';a.textContent=' Open archive →';p.append(a);results.append(p);status.textContent='Search is unavailable.';}
  }
  function openSearch(){if(drawer.open)drawer.close();palette.showModal();query.value='';query.focus();updatePalette();}
  document.querySelectorAll('[data-search]').forEach(trigger=>trigger.addEventListener('click',e=>{e.preventDefault();openSearch();}));
  query.addEventListener('input',updatePalette);
  document.addEventListener('keydown',e=>{
    const editing=e.target.closest('input,textarea,select,[contenteditable="true"]');
    if((e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!editing&&!e.ctrlKey&&!e.metaKey&&!e.altKey)){
      e.preventDefault();if(!palette.open)openSearch();
    }
  });
  palette.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();if(!resultLinks.length)return;
      selected=selected<0 ? (e.key==='ArrowDown'?0:resultLinks.length-1) : (selected+(e.key==='ArrowDown'?1:-1)+resultLinks.length)%resultLinks.length;
      resultLinks.forEach((a,i)=>a.classList.toggle('selected',i===selected));
      resultLinks[selected].focus();resultLinks[selected].scrollIntoView({block:'nearest'});
    } else if(e.key==='Enter'&&e.target===query){e.preventDefault();resultLinks[0]?.click();}
  });
  const menu=document.querySelector('[data-menu]');menu.hidden=false;
  menu.addEventListener('click',()=>drawer.showModal());
  for(const dialog of [palette,drawer]){
    dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  }
  const mq=matchMedia('(min-width:701px)');mq.addEventListener('change',e=>{if(e.matches&&drawer.open)drawer.close();});
  document.querySelectorAll('.copy-code').forEach(button=>{
    if(!navigator.clipboard)return;
    button.hidden=false;
    button.addEventListener('click',async()=>{
      try {await navigator.clipboard.writeText(button.closest('.code-block').querySelector('code').textContent);button.textContent='Copied';setTimeout(()=>button.textContent='Copy code',1800);}
      catch(error){console.error('[workbench:clipboard]',error);button.textContent='Select code to copy';}
    });
  });
  for(const collection of document.querySelectorAll('[data-collection]')) {
    const form=collection.querySelector('[data-filters]'), records=collection.querySelector('.records');
    let state='all';
    function update(){const settings={state,field:form.elements.field.value,year:form.elements.year?.value||'all'};
      const rows=[...records.querySelectorAll('[data-record]')];
      const sort=form.elements.sort.value;
      rows.sort((a,b)=>sort==='title'?a.dataset.title.localeCompare(b.dataset.title):sort==='oldest'?a.dataset.date.localeCompare(b.dataset.date):b.dataset.date.localeCompare(a.dataset.date));
      records.querySelectorAll('[data-year-heading]').forEach(h=>h.remove());
      let visible=0, lastYear='';
      for(const row of rows){
        row.hidden=!matchesFilters(row.dataset,settings);
        if(!row.hidden){
          visible++;
          if(collection.dataset.collection==='notebook'&&sort!=='title'&&row.dataset.year!==lastYear){
            const heading=document.createElement('h2');heading.className='year-label notebook-year';heading.dataset.yearHeading='';heading.textContent=row.dataset.year;records.append(heading);lastYear=row.dataset.year;
          }
        }
        records.append(row);
      }
      collection.querySelector('[data-empty]').hidden=visible!==0;
      collection.querySelector('.filter-status').textContent=`${visible} ${collection.dataset.collection} entries shown.`;
    }
    form.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{state=button.dataset.filter;form.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
    form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('change',update);
    form.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{records.classList.toggle('grid',button.dataset.view==='grid');form.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
    collection.querySelector('[data-reset]').addEventListener('click',()=>{form.reset();form.querySelector('[data-filter="all"]').click();});
    update();
  }
  const pageQuery=document.querySelector('#page-query');
  if(pageQuery){pageQuery.addEventListener('input',async()=>{
    const requested=pageQuery.value;
    try{const nodes=await getIndex();if(pageQuery.value!==requested)return;const matches=searchNodes(nodes,requested);paint(document.querySelector('#page-results'),matches);document.querySelector('.search-status').textContent=`${matches.length} nodes found.`;}
    catch(error){document.querySelector('.search-status').textContent='Search could not load. All entries remain available below.';}
  });}
  const article=document.querySelector('.article');
  if(article){const progress=document.querySelector('.reading-progress span');let scheduled=false;
    function updateProgress(){scheduled=false;const top=article.offsetTop, distance=Math.max(1,article.offsetHeight-innerHeight);progress.style.width=`${Math.max(0,Math.min(100,(scrollY-top)/distance*100))}%`;}
    addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress);}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
    const tocLinks=[...document.querySelectorAll('.article-rail nav a')];
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)tocLinks.forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-5% 0px -70% 0px'});
    article.querySelectorAll('h2[id]').forEach(h=>observer.observe(h));
    const narrow=matchMedia('(max-width:700px)');
    const disclosures=[...document.querySelectorAll('.rail-disclosure')];
    function updateDisclosures(){disclosures.forEach(d=>d.open=!narrow.matches);}
    disclosures.forEach(d=>{
      d.addEventListener('toggle',()=>{if(narrow.matches&&d.open)disclosures.filter(other=>other!==d).forEach(other=>other.open=false);});
      d.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(narrow.matches)d.open=false;}));
    });
    narrow.addEventListener('change',updateDisclosures);updateDisclosures();
  }
}
