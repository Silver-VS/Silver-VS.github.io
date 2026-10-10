/* Sin plan cargado: conservar el SAES como fuente, sin completar datos académicos por inferencia. */
window.IPNT_UNIDAD = window.SATE_UNIDAD;

/* ---------- perfil IPN-tools: respaldo y sincronización con la cuenta institucional (tools/cuenta.py) ---------- */
var IPNT=window.IPNT=(()=>{
  const CFG={"clientId": "7e8e5a95-4337-4652-8b07-3450306cda8f", "tenant": "common", "googleClientId": "959269733-d3h3qm0dtqpshebnabum1jr2g0l6geoa.apps.googleusercontent.com", "unidades": [{"id": "upiita", "disponible": true, "url": "horarios-upiita.html", "siglas": "UPIITA", "nombre": "Unidad Profesional Interdisciplinaria en Ingenier\u00eda y Tecnolog\u00edas Avanzadas"}, {"id": "escom", "disponible": true, "url": "horarios-escom.html", "siglas": "ESCOM", "nombre": "Escuela Superior de C\u00f3mputo"}, {"id": "upibi", "disponible": true, "url": "horarios-upibi.html", "siglas": "UPIBI", "nombre": "Unidad Profesional Interdisciplinaria de Biotecnolog\u00eda"}], "googlePrueba": true, "contacto": "vacevess1900@alumno.ipn.mx", "institucionalPendiente": true, "version": "1.2.0", "unidad": window.SATE_UNIDAD, "msal": "https://cdn.jsdelivr.net/npm/@azure/msal-browser@4.30.0/lib/msal-browser.min.js", "sri": "sha384-RGxxfG5yRS8DLU7ZJ8OoLhbV/BsJFHyPuMVHrTLbpj3t5Z15LnviJmaznKY/a7LZ"}, FILE='perfil.ipnt.json', MS_SCOPES=['Files.ReadWrite.AppFolder'],
    GO_SCOPES='openid email profile https://www.googleapis.com/auth/drive.appdata';
  // qué se guarda: todo lo de Horarios (hu.) y Electivas (ue.), menos el estado de pantalla de cada dispositivo
  const SYNC=/^(hu\.|ue\.)|^saes\.alumno$|^perfil\.opciones$/, LOCAL=/^hu\.(?:[a-z]+\.)?(tab|per|tur|niv|view|mview|cview|mobnote)$/;
  const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},
    del(k){try{localStorage.removeItem(k)}catch(e){}},keys(){try{return Object.keys(localStorage)}catch(e){return[]}},
    obj(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}},put(k,o){try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}}};
  const opt=()=>ls.obj('perfil.opciones',null)||ls.obj('ipnt.opt',{saes:false});   // ipnt.opt: versión anterior (solo local)
  if(!ls.get('perfil.opciones')&&ls.get('ipnt.opt')) ls.set('perfil.opciones',ls.get('ipnt.opt'));   // migración de la casilla local
  const sincroniza=k=>SYNC.test(k)&&!LOCAL.test(k)&&(k!=='saes.alumno'||opt().saes);
  const parse=s=>{try{return JSON.parse(s)}catch(e){return s}};
  let timer=null, busy=null, prov=null, cuenta=null, st={fase:'',ultimo:ls.get('ipnt.last'),error:''};

  /* ---- documento ---- */
  function documento(base){
    const t=ls.obj('ipnt.t',{}), b=ls.obj('ipnt.b',{}), claves={}, borrados={};
    // lo que este navegador no maneja (p. ej. datos del SAES sin autorización) se conserva tal como estaba
    if(base) for(const [k,e] of Object.entries(base.claves||{})) if(SYNC.test(k)&&!LOCAL.test(k)&&!sincroniza(k)) claves[k]=e;
    for(const k of ls.keys()) if(sincroniza(k)) claves[k]={t:t[k]||0,v:parse(ls.get(k))};
    for(const [k,v] of Object.entries(b)) if(sincroniza(k)&&!(k in claves)) borrados[k]=v;
    if(base) for(const [k,v] of Object.entries(base.borrados||{})) if(!(k in claves)&&!(k in borrados)) borrados[k]=v;
    return {ipnt:1,tipo:'perfil',app:'IPN-tools',version:CFG.version||'',unidad:CFG.unidad||'',guardado:new Date().toISOString(),claves,borrados};
  }
  function validar(d){
    if(!d||typeof d!=='object'||d.tipo!=='perfil'||typeof d.claves!=='object') throw new Error('El archivo no es un perfil de IPN-tools.');
    if(!(d.ipnt>=1)) throw new Error('El archivo no es un perfil de IPN-tools.');
    if(d.ipnt>1) throw new Error('El perfil se guardó con una versión más nueva de la herramienta. Actualiza la página.');
    return d;
  }
  // fusión clave por clave: gana la marca de tiempo más reciente; devuelve cuántas claves cambiaron aquí.
  // nubeGana (al iniciar sesión): lo guardado en la cuenta sustituye lo que había en el navegador; lo que solo
  // existe en el navegador se conserva y se sube.
  function fusionar(d,nubeGana){
    const t=ls.obj('ipnt.t',{}), b=ls.obj('ipnt.b',{});let n=0;
    // perfiles guardados antes de que la casilla se sincronizara: si la nube trae datos del SAES, el alumno ya lo autorizó
    if(d.claves?.['saes.alumno']&&!d.claves['perfil.opciones']&&!ls.get('perfil.opciones')){ls.set('perfil.opciones',JSON.stringify({saes:true}));t['perfil.opciones']=0}
    const es=Object.entries(d.claves||{}).sort(([a],[c])=>(c==='perfil.opciones')-(a==='perfil.opciones'));
    for(const [k,e] of es){
      if(!sincroniza(k)||!e) continue;
      const mia=t[k]??b[k]??null, hay=ls.get(k)!=null;
      if(nubeGana||(e.t||0)>(mia||0)||(!hay&&mia==null)){const v=JSON.stringify(e.v);if(ls.get(k)!==v){ls.set(k,v);n++}t[k]=e.t||0;delete b[k]}
    }
    for(const [k,bt] of Object.entries(d.borrados||{})){
      if(!sincroniza(k)) continue;
      if((nubeGana||bt>(t[k]||0))&&ls.get(k)!=null){ls.del(k);n++;b[k]=bt;delete t[k]}
    }
    ls.put('ipnt.t',t);ls.put('ipnt.b',b);return n;
  }
  const firma=d=>JSON.stringify([Object.entries(d.claves||{}).map(([k,e])=>[k,e.t]).sort(),Object.entries(d.borrados||{}).sort()]);

  /* ---- registro de cambios (lo llaman las páginas al guardar) ---- */
  function touch(k){if(!sincroniza(k))return;const t=ls.obj('ipnt.t',{}),b=ls.obj('ipnt.b',{});t[k]=Date.now();delete b[k];ls.put('ipnt.t',t);ls.put('ipnt.b',b);programar()}
  // escritura de las páginas: solo cuenta como cambio si el valor es distinto (volver a guardar lo mismo no gana la fusión)
  function set(k,v){const antes=ls.get(k);if(!ls.set(k,v))return;if(antes!==v)touch(k)}
  function borrar(k){if(!sincroniza(k))return;const t=ls.obj('ipnt.t',{}),b=ls.obj('ipnt.b',{});delete t[k];b[k]=Date.now();ls.put('ipnt.t',t);ls.put('ipnt.b',b);programar()}
  function programar(){if(!cuenta)return;clearTimeout(timer);timer=setTimeout(()=>{timer=null;sincronizar('auto')},3000)}

  /* ---- proveedores: misma interfaz (disponible, listo, recuperar, entrar, bajar, subir, salir) ---- */
  const cargar=(src,attrs={})=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;Object.assign(s,attrs);
    s.onload=ok;s.onerror=()=>no(new Error('No se pudo cargar el inicio de sesión. Revisa tu conexión.'));document.head.appendChild(s)});
  const expirada=()=>{const e=new Error('Tu sesión expiró. Vuelve a conectar tu cuenta.');e.expirada=true;return e};
  async function con(tok,url,o={}){return fetch(url,{...o,headers:{...(o.headers||{}),Authorization:'Bearer '+await tok()}})}

  // Microsoft Entra ID + OneDrive (carpeta de la aplicación: Aplicaciones › IPN-tools)
  const MS={id:'ms',nube:'OneDrive',pca:null,acc:null,
    disponible:()=>!!CFG.clientId,
    async listo(){
      if(this.pca) return;
      if(!window.msal) await cargar(CFG.msal,{integrity:CFG.sri,crossOrigin:'anonymous'});
      const pca=new msal.PublicClientApplication({auth:{clientId:CFG.clientId,authority:'https://login.microsoftonline.com/'+CFG.tenant,
        redirectUri:location.origin+location.pathname,navigateToLoginRequestUrl:false},cache:{cacheLocation:'localStorage'}});
      await pca.initialize();
      const r=await pca.handleRedirectPromise().catch(e=>{st.error=texto(e);return null});
      this.acc=r?.account||pca.getActiveAccount()||pca.getAllAccounts()[0]||null;
      if(this.acc) pca.setActiveAccount(this.acc);
      this.pca=pca;
    },
    async recuperar(){await this.listo();return this.acc?{name:this.acc.name||'',username:this.acc.username}:null},
    async entrar(){
      await this.listo();
      let r;
      try{r=await this.pca.loginPopup({scopes:MS_SCOPES,prompt:'select_account',redirectUri:new URL('../auth.html',location.href).href})}
      catch(e){ // ventanas emergentes bloqueadas (frecuente en teléfonos): inicio de sesión en la misma pestaña
        if(/popup_window_error|empty_window_error|block/i.test(String(e?.errorCode||e?.message))){ls.set('ipnt.prov','ms');await this.pca.loginRedirect({scopes:MS_SCOPES,prompt:'select_account'});return null}
        throw e}
      this.acc=r.account;this.pca.setActiveAccount(this.acc);
      return {name:this.acc.name||'',username:this.acc.username};
    },
    tok:async()=>{try{return (await MS.pca.acquireTokenSilent({scopes:MS_SCOPES,account:MS.acc})).accessToken}
      catch(e){if(e instanceof msal.InteractionRequiredAuthError)throw expirada();throw e}},
    G:'https://graph.microsoft.com/v1.0/me/drive/special/approot:/'+FILE,
    async bajar(){
      const r=await con(this.tok,this.G);
      if(r.status===404) return {doc:null,ver:null};
      if(!r.ok) throw new Error('OneDrive respondió '+r.status+' al leer tu perfil.');
      const it=await r.json(), c=it['@microsoft.graph.downloadUrl']?await fetch(it['@microsoft.graph.downloadUrl']):await con(this.tok,this.G+':/content');
      return {doc:validar(await c.json()),ver:it.eTag};
    },
    async subir(d,ver){
      const r=await con(this.tok,this.G+':/content',{method:'PUT',headers:{'Content-Type':'application/json',...(ver?{'If-Match':ver}:{'If-None-Match':'*'})},body:JSON.stringify(d)});
      if(r.status===412||r.status===409) return null;   // otro dispositivo escribió antes: se vuelve a fusionar
      if(!r.ok) throw new Error('OneDrive respondió '+r.status+' al guardar tu perfil.');
      return true;
    },
    async salir(){try{if(this.pca&&this.acc)await this.pca.clearCache({account:this.acc})}catch(e){}this.acc=null}
  };

  // Google + Google Drive (espacio privado de la aplicación, appDataFolder: no aparece entre los archivos del alumno).
  // Sin servidor, Google entrega tokens de 1 hora sin renovación automática: al vencer se pide «Volver a conectar».
  const GO={id:'google',nube:'Google Drive',tc:null,fid:null,
    disponible:()=>!!CFG.googleClientId,
    async listo(){
      if(!window.google?.accounts?.oauth2) await cargar('https://accounts.google.com/gsi/client');
      if(!this.tc) this.tc=google.accounts.oauth2.initTokenClient({client_id:CFG.googleClientId,scope:GO_SCOPES,callback:()=>{}});
    },
    pedir(prompt){return new Promise((ok,no)=>{
      this.tc.callback=r=>r.error?no(new Error(r.error_description||r.error)):ok(r);
      this.tc.error_callback=e=>no(new Error(e?.type==='popup_closed'?'user_cancelled':e?.type==='popup_failed_to_open'?'popup_window_error':(e?.message||e?.type||'error')));
      const acc=ls.obj('ipnt.gacc',null);
      this.tc.requestAccessToken({prompt,...(acc?.username?{login_hint:acc.username}:{})});
    })},
    async recuperar(){const a=ls.obj('ipnt.gacc',null);return a?{name:a.name,username:a.username}:null},
    async entrar(){
      await this.listo();
      const r=await this.pedir(ls.obj('ipnt.gacc',null)?'':'select_account');
      if(!google.accounts.oauth2.hasGrantedAllScopes(r,'https://www.googleapis.com/auth/drive.appdata'))
        throw new Error('Para guardar tus datos, autoriza el acceso al espacio de la aplicación en Google Drive.');
      ls.put('ipnt.gtok',{v:r.access_token,exp:Date.now()+(+r.expires_in||3600)*1000-60000});
      const u=await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+r.access_token}})).json();
      const a={name:u.name||'',username:u.email||''};ls.put('ipnt.gacc',a);return a;
    },
    tok:async()=>{const t=ls.obj('ipnt.gtok',null);if(t&&t.exp>Date.now())return t.v;throw expirada()},
    D:'https://www.googleapis.com/drive/v3/files', U:'https://www.googleapis.com/upload/drive/v3/files',
    async buscar(){
      const q=encodeURIComponent(`name='${FILE}' and trashed=false`);
      const r=await con(this.tok,`${this.D}?spaces=appDataFolder&q=${q}&fields=files(id,version)&orderBy=modifiedTime%20desc&pageSize=1`);
      if(r.status===401) throw expirada();
      if(!r.ok) throw new Error('Google Drive respondió '+r.status+' al leer tu perfil.');
      return (await r.json()).files?.[0]||null;
    },
    async bajar(){
      const f=await this.buscar();if(!f){this.fid=null;return {doc:null,ver:null}}
      this.fid=f.id;
      const c=await con(this.tok,`${this.D}/${f.id}?alt=media`);
      if(!c.ok) throw new Error('Google Drive respondió '+c.status+' al leer tu perfil.');
      return {doc:validar(await c.json()),ver:f.version};
    },
    async subir(d,ver){
      const body=JSON.stringify(d);
      if(!this.fid){
        if(await this.buscar()) return null;   // otro dispositivo lo creó mientras tanto: se vuelve a fusionar
        const b='ipnt'+Math.random().toString(36).slice(2), meta={name:FILE,parents:['appDataFolder'],mimeType:'application/json'};
        const r=await con(this.tok,`${this.U}?uploadType=multipart&fields=id`,{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},
          body:`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`});
        if(!r.ok) throw new Error('Google Drive respondió '+r.status+' al guardar tu perfil.');
        this.fid=(await r.json()).id;return true;
      }
      // Drive no admite escritura condicional: se comprueba la versión justo antes de escribir
      const m=await con(this.tok,`${this.D}/${this.fid}?fields=version`);
      if(m.ok&&ver&&(await m.json()).version!==ver) return null;
      const r=await con(this.tok,`${this.U}/${this.fid}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/json'},body});
      if(!r.ok) throw new Error('Google Drive respondió '+r.status+' al guardar tu perfil.');
      return true;
    },
    async salir(){const t=ls.obj('ipnt.gtok',null);try{if(t&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(t.v,()=>{})}catch(e){}
      ls.del('ipnt.gtok');ls.del('ipnt.gacc');this.fid=null}
  };
  const PROV={ms:MS,google:GO};

  /* modo: 'login' (gana la nube y se recarga), 'abrir' y 'volver' (al abrir la página o regresar a la pestaña: se
     recarga si llegaron cambios de otro dispositivo), 'auto' (tras un cambio propio: solo se avisa) */

  /* ---- al iniciar sesión: si la cuenta y el navegador tienen datos distintos, el alumno elige ---- */
  const ETQ=k=>/^hu\.(?:[a-z]+\.)?w\./.test(k)?'planes de horario y marcas':/^hu\.(?:[a-z]+\.)?t\./.test(k)?'materias elegidas en el mapa':/^ue\./.test(k)?'actividades de Electivas':
    k==='saes.alumno'?'datos del SAES':'preferencias y filtros';
  function diferencias(d){
    const out=new Set();
    for(const [k,e] of Object.entries(d.claves||{})){
      if(!sincroniza(k)||!e||k==='perfil.opciones') continue;
      const v=ls.get(k);if(v!=null&&v!==JSON.stringify(e.v)) out.add(ETQ(k));
    }
    return [...out];
  }
  function elegir(d,dif){return new Promise(ok=>{
    const dl=$i('ipnt-conf');if(!dl){ok('nube');return}
    const n=Object.keys(d.claves||{}).filter(k=>sincroniza(k)).length;
    $i('ipnt-conf-txt').innerHTML=`Tu cuenta ya tiene datos guardados${d.guardado?' (última vez: <b>'+esc(hora(d.guardado))+'</b>)':''}, `+
      `y este navegador tiene datos distintos en: <b>${dif.map(esc).join(', ')}</b>.`;
    const fin=r=>{dl.onclick=null;if(dl.close)dl.close();else dl.removeAttribute('open');ok(r)};
    dl.onclick=e=>{const b=e.target.closest('[data-conf]');if(b)fin(b.dataset.conf)};
    dl.oncancel=e=>e.preventDefault();   // hay que elegir una opción
    if(dl.showModal)dl.showModal();else dl.setAttribute('open','');
  })}
  // «conservar lo de este navegador»: sus valores se marcan como los más recientes y ganan la fusión
  function ganaLocal(){const t=ls.obj('ipnt.t',{}),b=ls.obj('ipnt.b',{}),ahora=Date.now();
    for(const k of ls.keys()) if(sincroniza(k)){t[k]=ahora;delete b[k]}
    ls.put('ipnt.t',t);ls.put('ipnt.b',b)}

  function sincronizar(modo){
    if(!cuenta||!prov) return Promise.resolve(0);
    if(busy){programar();return busy}
    st.fase='sync';st.error='';pintar();
    busy=(async()=>{
      let cambios=0;
      for(let i=0;i<3;i++){
        const {doc,ver}=await prov.bajar();
        let nube=modo==='login'&&i===0;
        if(doc&&nube){const dif=diferencias(doc);if(dif.length&&(await elegir(doc,dif))==='local'){ganaLocal();nube=false}}
        if(doc) cambios+=fusionar(doc,nube);
        const mio=documento(doc);
        if(doc&&firma(doc)===firma(mio)) return cambios;
        if(await prov.subir(mio,ver)) return cambios;
      }
      throw new Error('No se pudo guardar: otro dispositivo está escribiendo al mismo tiempo. Intenta de nuevo.');
    })().then(n=>{
      st.fase='ok';st.ultimo=new Date().toISOString();ls.set('ipnt.last',st.ultimo);
      if(n>0){
        // la página lee sus datos al cargar: se recarga para mostrarlos (sin repetir en menos de 15 s, para no ciclar)
        let ult=0;try{ult=+sessionStorage.getItem('ipnt.recarga')||0}catch(e){}
        if(modo!=='auto'&&Date.now()-ult>15000){try{sessionStorage.setItem('ipnt.recarga',String(Date.now()))}catch(e){}location.reload();return n}
        st.fase='cambios';
      }
      return n;
    }).catch(e=>{st.fase=e?.expirada?'expirada':'error';st.error=texto(e);return 0}).finally(()=>{busy=null;pintar()});
    return busy;
  }
  const texto=e=>{const m=String(e?.errorMessage||e?.message||e||'');
    if(/AADSTS65001|AADSTS90094|consent/i.test(m)) return 'Las cuentas institucionales del IPN aún no están disponibles: la aplicación está en proceso de autorización. Puedes usar una cuenta personal de Microsoft o tu cuenta de Google.';
    if(/user_cancelled|cancel|access_denied/i.test(m)) return 'Inicio de sesión cancelado.';
    if(/popup_window_error/i.test(m)) return 'El navegador bloqueó la ventana de inicio de sesión. Permite las ventanas emergentes para este sitio.';
    return m.split('\n')[0].slice(0,220)};
  async function entrar(id){
    const p=PROV[id];if(!p)return;
    st.error='';st.fase='login';st.prov=id;pintar();
    try{
      const a=await p.entrar();if(!a)return;   // redirección en curso
      if(prov&&prov!==p) await prov.salir();
      prov=p;cuenta=a;ls.set('ipnt.prov',id);ls.set('ipnt.cuenta',a.username);
      await sincronizar('login');
    }catch(e){st.fase='error';st.error=texto(e);
      if(id==='google'&&CFG.googlePrueba&&/cancelado|access_denied/i.test(st.error+String(e?.message)))
        st.error='No se completó el inicio de sesión con Google. Durante la fase de prueba solo pueden acceder las cuentas registradas'+(CFG.contacto?`; para solicitar acceso, escribe a ${CFG.contacto}.`:'.');
      pintar()}
  }
  async function salir(borrarLocal){
    if(prov) await prov.salir();
    prov=null;cuenta=null;['ipnt.cuenta','ipnt.prov','ipnt.last'].forEach(k=>ls.del(k));st={fase:'',ultimo:null,error:''};
    if(borrarLocal){for(const k of ls.keys())if(/^(hu\.|ue\.|saes\.|ipnt\.)/.test(k))ls.del(k);location.reload();return}
    pintar();
  }

  /* ---- respaldo en archivo ---- */
  function descargar(){
    const d=documento(null), a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));
    a.download='ipn-tools-respaldo-'+new Date().toISOString().slice(0,10)+'.ipnt.json';
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
  }
  async function restaurar(file){
    const d=validar(JSON.parse(await file.text())), ahora=Date.now(), t=ls.obj('ipnt.t',{});let n=0;
    const b=ls.obj('ipnt.b',{});
    for(const [k,e] of Object.entries(d.claves)) if(SYNC.test(k)&&!LOCAL.test(k)&&e){ls.set(k,JSON.stringify(e.v));t[k]=ahora;delete b[k];n++}
    ls.put('ipnt.t',t);ls.put('ipnt.b',b);
    if(cuenta) await sincronizar('auto');
    return n;
  }

  /* ---- interfaz ---- */
  const $i=id=>document.getElementById(id);
  const hora=iso=>{if(!iso)return'';const d=new Date(iso);return d.toLocaleDateString('es-MX',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})};
  function pintar(){
    const btn=$i('ipnt-open'), dl=$i('ipnt-dlg');if(!btn||!dl)return;
    const on=!!cuenta, nom=on?(cuenta.name||cuenta.username):'', nube=prov?.nube||'la nube';
    btn.classList.toggle('on',on);btn.classList.toggle('warn',st.fase==='error'||st.fase==='expirada'||st.fase==='cambios');
    btn.querySelector('span').textContent=on?(nom.split(/\s+/)[0]||'Mi cuenta'):'Iniciar sesión';
    btn.title=on?`Sesión: ${cuenta.username}`:'Inicia sesión para guardar tus datos en tu nube';
    $i('ipnt-out').hidden=on;$i('ipnt-in').hidden=!on;
    $i('ipnt-login').disabled=!MS.disponible()||st.fase==='login';$i('ipnt-glogin').disabled=!GO.disponible()||st.fase==='login';
    $i('ipnt-glogin').hidden=!GO.disponible();$i('ipnt-gnote').hidden=!GO.disponible();
    document.querySelectorAll('.ipnt-prueba:not(.ipnt-msprueba)').forEach(n=>n.hidden=!(GO.disponible()&&CFG.googlePrueba));
    document.querySelectorAll('.ipnt-msprueba').forEach(n=>n.hidden=!(MS.disponible()&&CFG.institucionalPendiente));
    document.querySelectorAll('.ipnt-contacto').forEach(n=>{if(!n.firstChild&&CFG.contacto){const a=document.createElement('a');a.href='mailto:'+CFG.contacto;a.textContent=CFG.contacto;n.appendChild(a)}});
    $i('ipnt-soon').hidden=MS.disponible()||GO.disponible();
    if(on){$i('ipnt-who').textContent=nom+(cuenta.name?` · ${cuenta.username}`:'');$i('ipnt-where').textContent=nube}
    const s=$i('ipnt-state'), f=st.fase;
    s.className='ipnt-state '+(f==='error'||f==='expirada'?'bad':f==='cambios'?'warn':f==='ok'?'ok':'');
    s.innerHTML=f==='sync'?'Sincronizando…':f==='login'?`Abriendo el inicio de sesión de ${st.prov==='google'?'Google':'Microsoft'}…`:
      f==='cambios'?'Se recibieron cambios de otro dispositivo. <button class="link" type="button" data-ipnt-reload>Recargar para verlos</button>':
      f==='error'||f==='expirada'?esc(st.error):on&&st.ultimo?`Guardado en tu ${nube} · `+hora(st.ultimo):on?'Conectado.':'';
    if(!on&&st.error&&f!=='sync'){s.className='ipnt-state bad';s.textContent=st.error}
    $i('ipnt-saes').checked=!!opt().saes;
    $i('ipnt-relogin').hidden=f!=='expirada';
    $i('ipnt-relogin').textContent=prov?.id==='google'?'Volver a conectar con Google':'Volver a iniciar sesión';
  }
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function wire(){
    const dl=$i('ipnt-dlg'), btn=$i('ipnt-open');if(!dl||!btn)return;
    // las bibliotecas se cargan al abrir el diálogo: así el clic en «Continuar con…» puede abrir la ventana emergente
    const abrir=()=>{if(dl.showModal&&!dl.open)dl.showModal();else dl.setAttribute('open','');
      if(MS.disponible())MS.listo().catch(()=>{});if(GO.disponible())GO.listo().catch(()=>{});pintar()};
    const cerrar=()=>{if(dl.close)dl.close();else dl.removeAttribute('open')};
    btn.addEventListener('click',abrir);$i('ipnt-x').addEventListener('click',cerrar);dl.addEventListener('click',e=>{if(e.target===dl)cerrar()});
    $i('ipnt-login').addEventListener('click',()=>entrar('ms'));$i('ipnt-glogin').addEventListener('click',()=>entrar('google'));
    $i('ipnt-relogin').addEventListener('click',()=>entrar(prov?.id||ls.get('ipnt.prov')||'ms'));
    $i('ipnt-sync').addEventListener('click',()=>sincronizar('volver'));
    $i('ipnt-logout').addEventListener('click',()=>salir(false));
    $i('ipnt-wipe').addEventListener('click',()=>{const c=$i('ipnt-wipe-ok');c.hidden=!c.hidden});
    $i('ipnt-wipe-yes').addEventListener('click',()=>salir(true));
    $i('ipnt-saes').addEventListener('change',e=>{const o={...opt(),saes:e.target.checked};set('perfil.opciones',JSON.stringify(o));if(o.saes&&ls.get('saes.alumno'))touch('saes.alumno')});
    $i('ipnt-down').addEventListener('click',descargar);
    $i('ipnt-file').addEventListener('change',async e=>{const f=e.target.files[0],m=$i('ipnt-filemsg');if(!f)return;
      try{const n=await restaurar(f);m.className='ipnt-state ok';m.textContent=`Respaldo restaurado (${n} elementos). Recargando…`;setTimeout(()=>location.reload(),900)}
      catch(err){m.className='ipnt-state bad';m.textContent=texto(err)}e.target.value=''});
    dl.addEventListener('click',e=>{if(e.target.closest('[data-ipnt-reload]'))location.reload()});
    // al volver a la pestaña se traen los cambios de otros dispositivos; al salir se guarda lo pendiente
    document.addEventListener('visibilitychange',()=>{if(!cuenta||st.fase==='expirada')return;
      if(document.visibilityState==='hidden'){if(timer){clearTimeout(timer);timer=null;sincronizar('auto')}}
      else if(!timer&&(!st.ultimo||Date.now()-new Date(st.ultimo)>20000))sincronizar('volver')});
    pintar();
    // sesión guardada (o regreso del inicio de sesión de Microsoft en la misma pestaña)
    const id=ls.get('ipnt.prov')||(ls.get('ipnt.cuenta')||/[#&?](code|error)=/.test(location.hash+location.search)?'ms':null), p=PROV[id];
    if(p&&p.disponible()) p.recuperar().then(a=>{
      if(!a){if(st.error)st.fase='error';pintar();return}
      const recien=!ls.get('ipnt.cuenta');   // regreso del inicio de sesión en la misma pestaña (Microsoft en teléfono)
      prov=p;cuenta=a;ls.set('ipnt.prov',id);ls.set('ipnt.cuenta',a.username);pintar();sincronizar(recien?'login':'abrir');
    }).catch(e=>{st.fase='error';st.error=texto(e);pintar()});
  }
  /* ---- bienvenida: primera visita (sin carrera, planes, marcas, actividades ni sesión en este navegador) ---- */
  // por unidad: la UPIITA usa hu./ue.; otras unidades, hu.<unidad>. (mismo sitio, datos separados)
  const UNI=CFG.unidad||'upiita', BKEY=UNI==='upiita'?'ipnt.bienvenida':'ipnt.bienvenida.'+UNI;
  const OTRAS=new RegExp('^hu[.]('+((CFG.unidades||[]).map(u=>u.id).filter(x=>x&&x!=='upiita').join('|')||'-')+')[.]');
  const propia=k=>UNI==='upiita'?/^(hu\.|ue\.)/.test(k)&&!OTRAS.test(k):k.startsWith('hu.'+UNI+'.');
  const NUEVO=!ls.get(BKEY)&&!ls.get('ipnt.cuenta')&&!ls.keys().some(k=>propia(k)&&!LOCAL.test(k));
  function bienvenida(o){
    const dl=$i('ipnt-hola'), sel=document.querySelector(o.select);
    if(!dl||!sel||(!NUEVO&&!o.force)) return;
    $i('ipnt-hola-h').textContent=o.force?'Cambiar unidad académica':'Bienvenida';
    $i('ipnt-h-lead').textContent=o.force?'Elige la unidad académica que quieres consultar.':'Selecciona tu unidad y programa académico.';
    const UN=CFG.unidades||[], cars=[...sel.options].map(op=>[op.value,op.textContent.trim()]).filter(c=>c[0]);
    let uni=(CFG.unidades||[]).length>1?null:CFG.unidad;   // con varias unidades, el programa se elige después de la unidad
    const listo=()=>{ls.set(BKEY,'1');if(dl.close)dl.close();else dl.removeAttribute('open')};
    const pintarH=()=>{
      $i('ipnt-h-uni').hidden=UN.length<2;
      if(UN.length<2)$i('ipnt-h-lead').textContent='Selecciona tu programa académico.';
      $i('ipnt-h-unis').innerHTML=UN.map(u=>`<button type="button" class="ipnt-uni" data-uni="${esc(u.id)}" aria-pressed="${u.id===uni}"><b>${esc(u.siglas)}</b><small>${esc(u.nombre)}</small>${u.disponible?'':'<em>En preparación</em>'}</button>`).join('');
      const u=UN.find(x=>x.id===uni)||{};
      $i('ipnt-h-cars').hidden=!uni;
      $i('ipnt-h-cars').innerHTML=!uni?'':u.id===CFG.unidad?
        `<h3>${UN.length>1?'2. ':''}Elige tu programa académico</h3><div class="ipnt-cars">${cars.map(([k,v])=>`<button type="button" class="btn" data-car="${esc(k)}">${esc(v)}</button>`).join('')}</div>`:
        u.url?`<h3>${UN.length>1?'2. ':''}Continúa en la herramienta de tu unidad</h3><p><a class="btn primary" href="${esc(u.url)}">Ir a Horarios ${esc(u.siglas)}</a></p>`:
        `<p class="saes-note">La versión para ${esc(u.siglas||'tu unidad')} se está preparando con alumnos de la unidad. Mientras tanto puedes explorar la de la ${esc((UN.find(x=>x.id===CFG.unidad)||{}).siglas||'')}.</p>`;
      $i('ipnt-h-yo').hidden=!cuenta;
      if(cuenta)$i('ipnt-h-yo').textContent=`Sesión iniciada: ${cuenta.name||cuenta.username}. Si ya tenías datos guardados, la página se actualizará sola; si no, elige tu unidad y programa académico.`;
      $i('ipnt-h-ms').hidden=!MS.disponible();$i('ipnt-h-go').hidden=!GO.disponible();pintar();
      $i('ipnt-h-login').hidden=!!cuenta||!(MS.disponible()||GO.disponible());
    };
    // Reabrir el selector reemplaza sus manejadores para evitar cambios duplicados.
    dl.onclick=async e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.uni){uni=b.dataset.uni;pintarH();$i('ipnt-h-cars').scrollIntoView?.({block:'nearest',behavior:'smooth'});return}
      if(b.dataset.car){sel.value=b.dataset.car;sel.dispatchEvent(new Event('change',{bubbles:true}));listo();return}
      if(b.dataset.prov){
        const m=$i('ipnt-h-msg');m.className='ipnt-state';m.textContent='Abriendo el inicio de sesión…';
        await entrar(b.dataset.prov);
        if(cuenta){m.textContent='';ls.set(BKEY,'1')}else{m.className='ipnt-state bad';m.textContent=st.error||''}
        pintarH();return}
      if(b.hasAttribute('data-hola-x'))listo();
    };
    dl.oncancel=()=>ls.set(BKEY,'1');   // Esc: no se vuelve a mostrar
    if(MS.disponible())MS.listo().catch(()=>{});if(GO.disponible())GO.listo().catch(()=>{});   // listas para el clic
    pintarH();
    if(dl.showModal)dl.showModal();else dl.setAttribute('open','');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else setTimeout(wire,0);
  return {bienvenida,diferencias,elegir,set,touch,borrar,documento,fusionar,validar,sincronizar,descargar,restaurar,get cuenta(){return cuenta},get proveedor(){return prov?.id||null}};
})();


/* ---------- datos del SAES (v2): solo en este navegador ---------- */
const SAES={
  KEY:'saes.alumno',
  U(){return window.IPNT_UNIDAD||'upiita'},   // unidad de la página; los datos sin unidad son de la UPIITA (versiones anteriores)
  load(){try{const v=JSON.parse(localStorage.getItem(this.KEY)||'null');return v&&v.upiita_saes===1&&(v.unidad||'upiita')===this.U()?v:null}catch(e){return null}},
  save(d){if(window.IPNT)IPNT.set(this.KEY,JSON.stringify(d));else try{localStorage.setItem(this.KEY,JSON.stringify(d))}catch(e){}},
  clear(){try{localStorage.removeItem(this.KEY)}catch(e){}if(window.IPNT)IPNT.borrar(this.KEY)},
  parse(t){try{const d=JSON.parse(String(t||'').trim());if(d&&d.upiita_saes===1&&Array.isArray(d.acreditadas))return d}catch(e){}return null},
  autorizada(d){const s=String(d?.avance?.autorizada||'');   // «MEDIA-REPROBADAS = 40.00 - 22.50 CREDITOS»: el tope total es la media (incluye las reprobadas)
    const m=s.match(/=\s*(\d+(?:\.\d+)?)\s*-\s*\d/)||s.match(/(\d+(?:\.\d+)?)\s*CR/i)||s.match(/(\d+(?:\.\d+)?)/);return m?+m[1]:null},
  open(){const dl=document.getElementById('saes-dlg');if(!dl)return;if(dl.showModal&&!dl.open)dl.showModal();else dl.setAttribute('open','')},
  close(){const dl=document.getElementById('saes-dlg');if(!dl)return;if(dl.close)dl.close();else dl.removeAttribute('open')},
  /* conecta el botón y la ventana: abrir, arrastrar el marcador, copiar su código y pegar los datos */
  wire(onLoad){
    const dl=document.getElementById('saes-dlg');if(!dl)return;
    const paste=dl.querySelector('#saes-paste'), msg=dl.querySelector('#saes-msg');
    // delegado: también funciona con botones que se agregan después (p. ej. el recordatorio de Estado general)
    document.addEventListener('click',e=>{if(!e.target.closest?.('[data-saes-open]'))return;e.preventDefault();SAES.open()});
    dl.querySelector('#saes-x').addEventListener('click',()=>SAES.close());
    dl.addEventListener('click',e=>{if(e.target===dl)SAES.close()});   // clic fuera de la ventana
    const take=async t=>{const d=SAES.parse(t);if(!d){msg.innerHTML='<span class="bad">El contenido no corresponde al Lector IPN-tools. Ejecuta el marcador en el SAES y selecciona «Copiar mis datos».</span>';return}
      // Datos de otra unidad: se guardan y se abre el SATE de esa unidad (cualquier unidad tiene SATE).
      const suya=String(d.unidad||'upiita');
      if(suya!==SAES.U()&&/^[a-z0-9-]+$/.test(suya)){SAES.save(d);paste.value='';
        msg.textContent='Tus datos son del SAES de '+suya.toUpperCase()+'. Abriendo SATE de '+suya.toUpperCase()+'…';
        setTimeout(()=>{location.href=(globalThis.SATE?'index.html':'sate/index.html')+'?sateUnidad='+suya},900);return}
      const aceptar=()=>{SAES.save(d);paste.value='';msg.textContent='Datos del SAES cargados.';onLoad(d);setTimeout(()=>SAES.close(),900)};
      if(globalThis.SATE){
        try{await SATE.script('tramites.js');SateTramites.confirmarSaes(d,msg,aceptar)}
        catch(e){console.error('Lector: confirmación no disponible',{fase:'identidad',error:e.name});msg.textContent='No se pudieron guardar tus datos. Intenta de nuevo.'}
      }else aceptar();
    };
    paste.addEventListener('paste',e=>{e.preventDefault();return take(e.clipboardData.getData('text'))});
    paste.addEventListener('input',()=>{if(paste.value.trim().startsWith('{'))return take(paste.value)});
    dl.querySelector('#saes-paste-clip').addEventListener('click',async e=>{
      const boton=e.currentTarget;
      let texto;
      try{
        if(!navigator.clipboard?.readText)throw new Error('clipboard-unavailable');
        texto=await navigator.clipboard.readText();
      }catch(err){
        // El permiso depende del navegador: conservar siempre el pegado manual.
        msg.textContent=boton.dataset.fallback;paste.focus();return;
      }
      return take(texto);
    });
    // copiar el código: portapapeles moderno, luego execCommand; si ambos fallan, queda seleccionado para copiarlo a mano
    dl.querySelector('#saes-copybm').addEventListener('click',async e=>{const b=e.currentTarget,box=dl.querySelector('#saes-bmcode'),m=dl.querySelector('#saes-copymsg');
      let ok=false;try{await navigator.clipboard.writeText(box.value);ok=true}catch(err){}
      if(!ok){box.focus();box.select();box.setSelectionRange(0,box.value.length);try{ok=document.execCommand('copy')}catch(err){}}
      b.textContent=ok?'Copiado ✓':'Copiar';m.textContent=ok?'Código copiado. Pégalo como dirección (URL) del marcador.':'El navegador no permitió copiar: el código ya está seleccionado; mantén presionado y elige «Copiar».';
      if(ok)setTimeout(()=>{b.textContent='Copiar'},2500)});
    dl.querySelector('#saes-again').addEventListener('click',()=>{dl.querySelector('#saes-steps').hidden=false});
    dl.querySelector('#saes-install').addEventListener('click',()=>{dl.querySelector('#saes-manual').open=true});
    dl.querySelector('#saes-clear').addEventListener('click',e=>{
      if(!e.target.dataset.confirm){e.target.dataset.confirm='1';e.target.textContent='Confirmar: borrar mis datos';setTimeout(()=>{delete e.target.dataset.confirm;e.target.textContent='Borrar mis datos'},4000);return}
      SAES.clear();msg.textContent='Tus datos del SAES se borraron de este navegador.';onLoad(null)});
  },
  /* aviso cuando se explora una carrera distinta a la del perfil cargado: nada del perfil se aplica ni se modifica */
  mismatch(car,nameOf,onBack,carOf=d=>d?.carrera){
    const el=document.getElementById('saes-mismatch');if(!el)return;
    const d=SAES.load(), cap=s=>String(s||'').toLowerCase().replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(En|De|Y)\b/g,w=>w.toLowerCase()).replace(/^Ingenieria\b/,'Ingeniería');
    let hid=null;try{hid=localStorage.getItem('saes.aviso')}catch(e){}
    if(!d||!d.carrera||carOf(d)===car||hid===d.leido){el.hidden=true;return}
    const mine=cap(nameOf(carOf(d))||d.carrera_nombre), here=cap(nameOf(car));
    el.innerHTML=`<p><b>Consultando ${here||'otra carrera'}.</b> Tus datos del SAES corresponden a ${mine}; el avance y las sugerencias no se aplican en esta carrera.</p>`+
      `<div class="mm-act"><button class="btn" type="button" data-mm="back">Volver a ${mine}</button><button class="btn" type="button" data-mm="load">Usar datos de otra sesión</button><button class="x" type="button" data-mm="hide" aria-label="Ocultar este aviso" title="Ocultar este aviso">×</button></div>`;
    el.hidden=false;
    el.onclick=e=>{const a=e.target.closest('[data-mm]')?.dataset.mm;if(!a)return;
      if(a==='back')onBack(carOf(d));else if(a==='load')SAES.open();
      else{try{localStorage.setItem('saes.aviso',d.leido)}catch(err){}el.hidden=true}};
  },
  status(d){
    const st=document.getElementById('saes-status'), btn=document.getElementById('saes-open');
    if(btn){btn.classList.toggle('on',!!d);btn.querySelector('span').textContent=d?'Actualizar mis datos del SAES':'Usar mis datos del SAES';
      btn.title=d?'Datos del SAES cargados. Selecciona para actualizarlos o eliminarlos.':'Incorpora tu avance desde el SAES (opcional)'}
    if(!st)return;
    st.hidden=!d;document.getElementById('saes-steps').hidden=!!d;document.getElementById('saes-clear').hidden=!d;
    // El recordatorio arriba solo ayuda cuando la copia tiene más de 30 días.
    const antiguo=!!d&&Date.now()-new Date(d.leido).getTime()>30*24*60*60*1000;
    document.getElementById('saes-stale').hidden=!antiguo;
    const aviso=document.getElementById('saes-reminder');if(aviso)aviso.hidden=antiguo;
    if(!d)return;
    const f=new Date(d.leido).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});
    st.querySelector('#saes-who').textContent=`${d.carrera_nombre||''} · boleta ${d.boleta||'—'} · leídos el ${f}`;
  }
};

SATE.calendario={
  categorias:['inscripcion','ordinaria','extraordinaria','inscripcion_ets','ets','vacaciones','saberes','descanso','sindical','suspension','reanudacion','inicio','inicio_nms','fin','politecnico','induccion','induccion_nms','nivelacion','planeacion','posgrado','grado_posgrado','academico','gestion','becas','servicios','tt','feriado'],
  hoy(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')},
  cita(){
    if(typeof isPersonal!=='function'||!isPersonal())return null;
    const iso=s=>{const m=String(s||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):null}, desde=iso(ALUMNO.cita?.inicio);
    return desde?{desde,hasta:iso(ALUMNO.cita.fin)||desde,titulo:SATE.texto('sate.calendario.tu_cita'),categoria:'gestion',periodo:perName(perDeFecha(ALUMNO.cita.inicio)),fuente:SATE.texto('sate.calendario.fuente_saes'),nota:ALUMNO.cita.inicio,personal:true}:null;
  },
  fusion(base,unidad){
    const locales=[...(unidad?.actividades||[]),...(unidad?.eventos||[])].map(e=>({...e,hasta:e.hasta||e.desde,periodo:e.periodo||unidad.periodo,audiencia:e.audiencia||['alumnos'],fuente:e.fuente||unidad.fuente,origen:'unidad'}));
    // Un calendario propio sustituye sus periodos completos; los avisos aislados conservan la base restante.
    const clave=e=>[e.categoria,e.periodo,[...(e.audiencia||['alumnos'])].sort().join(','),['descanso','sindical','politecnico'].includes(e.categoria)?e.desde:''].join('|');
    const reemplazos=new Set(locales.filter(e=>e.reemplaza).map(clave));
    return [...(base?.eventos||[]).filter(e=>!unidad?.periodosPropios?.includes(e.periodo)&&!reemplazos.has(clave(e))).map(e=>({...e,fuente:base.fuente,url:base.url,origen:'ipn'})),...locales];
  },
  filtrarAudiencia(eventos,ampliar=false,alumno=null){
    const nuevo=!alumno||!Number(alumno.avance?.cursados)||Number(alumno.avance.cursados)<=1;
    return eventos.filter(e=>(e.audiencia||['alumnos']).some(a=>a==='alumnos'||a==='nuevo_ingreso'&&nuevo||ampliar&&['docentes','posgrado','nms'].includes(a)));
  },
  eventos(ampliar=false){
    const base=typeof SATE_CONFIG==='undefined'?null:SATE_CONFIG.calendarioBase;
    const c=(typeof DATA==='undefined'?null:DATA.calendario)||(typeof SATE_CONFIG==='undefined'?null:SATE_CONFIG.calendariosUnidad?.[SATE_UNIDAD]);
    const alumno=typeof ALUMNO!=='undefined'?ALUMNO:SATE.alumno?.(), cita=this.cita();
    return this.filtrarAudiencia([...this.fusion(base,c),...(cita?[cita]:[])],ampliar,alumno);
  },
  proximos(n=5,categorias=this.categorias){const hoy=this.hoy();return this.eventos().filter(a=>a.hasta>=hoy&&categorias.includes(a.categoria)).sort((a,b)=>a.desde.localeCompare(b.desde)||a.hasta.localeCompare(b.hasta)).slice(0,Math.max(0,n))},
  recorte(pestana){
    if(SATE_CONFIG.unidades[SATE_UNIDAD].generica||!SATE_CONFIG.unidades[SATE_UNIDAD].pestanas.includes('calendario')||!['horarios','mapa','trayectoria'].includes(pestana))return [];
    const todos=this.proximos(Infinity,pestana==='trayectoria'?this.categorias:['gestion','academico','inscripcion','inicio','ets','inscripcion_ets']);
    const adeudos=pestana==='mapa'&&isPersonal()&&conSim(false,()=>tr().fail.length>0);
    return todos.filter(e=>pestana==='trayectoria'||(pestana==='horarios'?(e.personal||/citas publicadas|inscripci[oó]n/i.test(e.titulo)&&!['ets','inscripcion_ets'].includes(e.categoria)&&!/ETS/i.test(e.titulo)):(/^Inicio del periodo/i.test(e.titulo)||adeudos&&(['ets','inscripcion_ets'].includes(e.categoria)||/ETS/i.test(e.titulo))))).slice(0,2);
  },
  abrirProceso(evento){this.procesoPendiente=evento;SATE.ir('calendario')},
  pintarRecorte(pestana){
    if(SATE_CONFIG.unidades[SATE_UNIDAD].generica)return;
    // Mi trayectoria reutiliza el próximo proceso dentro de su resumen personal.
    const panel=document.getElementById(pestana==='horarios'?'v-hor':pestana==='mapa'?'v-tray':'sate-trayectoria');
    if(!panel||!['horarios','mapa','trayectoria'].includes(pestana))return;
    Array.from(panel.children).find(n=>n.className==='sate-recorte-calendario')?.remove();
    if(pestana==='trayectoria'&&isPersonal())return;
    const recorte=SateUI.recorteCalendario(this.recorte(pestana));
    if(recorte)panel.insertBefore(recorte,panel.firstChild);
  }
};

(function () {
  if (!SATE_UNIDAD) {
    // Reutilizar el Lector: una unidad vacía dirige cualquier pegado válido a su SATE.
    window.IPNT_UNIDAD='entrada';
    const abrir=SAES.open.bind(SAES); let conectado=false;
    SAES.open=async()=>{
      try {
        await SATE.script('saes-dialogo.js');
        if(!conectado){SAES.wire(()=>{});conectado=true}
        SAES.status(null); abrir();
      } catch(e){SATE.error(e)}
    };
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-saes-open]')&&!conectado){e.preventDefault();SAES.open()}});
    return;
  }
  const unidad = SATE_UNIDAD, $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numero = v => v != null && String(v).trim() !== '' && Number.isFinite(+v) && +v >= 0 ? +v : null;
  const dato = v => numero(v) == null ? 'Sin dato del SAES' : esc(numero(v));
  function datos(a) {
    a ||= {};
    const materias = new Map(), altas = new Set((a.acreditadas || []).filter(r => numero(r[1]) >= 6 && numero(r[1]) <= 10).map(r => r[0]));
    const curso = new Set([...(a.en_curso || []), ...(a.horario_inscrito || []).map(r => r[1])]);
    const reprobadas = new Set((a.reprobadas_periodo || []).map(r => r[0]));
    const normal = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
    const reproNombres = new Set((a.reprobadas || []).map(r => normal(r[0])));
    const desfasadas = new Set((a.desfasadas_saes || []).map(r => r[0]));
    const agregar = (k, nombre, semestre, periodo) => {
      if (!k) return;
      const m = materias.get(k) || {clave:k,nombre:k,semestre:null,periodo:null};
      if (nombre) m.nombre = nombre;
      if (numero(semestre) > 0) m.semestre = numero(semestre);
      if (periodo) m.periodo = periodo;
      materias.set(k,m);
    };
    Object.entries(a.materias || {}).forEach(([k,m]) => {if(Array.isArray(m))agregar(k,m[0],m[1])});
    for (const tipo of ['acreditadas','kardex_reprobadas']) for (const r of a[tipo] || []) agregar(r[0],null,null,r[2]);
    for (const tipo of ['no_cursadas','reprobadas_periodo','desfasadas_saes']) for (const r of a[tipo] || []) agregar(r[0],null,r[3],null);
    for (const k of curso) agregar(k,null,null,null);
    for (const r of a.horario_inscrito || []) agregar(r[1],r[2],null,null);
    const porSemestre = [...materias.values()].some(m => m.semestre != null), grupos = new Map();
    for (const m of materias.values()) {
      if (reproNombres.has(normal(m.nombre)) || reproNombres.has(normal(m.clave))) reprobadas.add(m.clave);
      m.estado = altas.has(m.clave) ? 'Acreditada' : desfasadas.has(m.clave) ? 'Desfasada según el SAES' : curso.has(m.clave) ? 'En curso' : reprobadas.has(m.clave) ? 'Reprobada' : 'Por cursar';
      m.color = altas.has(m.clave) ? 'var(--ok)' : desfasadas.has(m.clave) ? 'var(--ipn-desfasada)' : curso.has(m.clave) ? 'var(--accent)' : reprobadas.has(m.clave) ? 'var(--ipn-reprobada)' : 'var(--line)';
      const grupo = porSemestre ? m.semestre == null ? 'Sin semestre informado' : 'Semestre '+m.semestre : m.periodo ? 'Periodo '+m.periodo : curso.has(m.clave) ? 'En curso' : 'Por cursar';
      if (!grupos.has(grupo)) grupos.set(grupo,[]);
      grupos.get(grupo).push(m);
    }
    const ordenados = [...grupos].sort((a,b) => {
      if(porSemestre)return (a[1][0].semestre ?? Infinity)-(b[1][0].semestre ?? Infinity);
      return (a[0].startsWith('Periodo ') ? 0 : 1)-(b[0].startsWith('Periodo ') ? 0 : 1)||a[0].localeCompare(b[0],'es',{numeric:true});
    });
    return {grupos:ordenados,materias:[...materias.values()],viejo:!a.materias};
  }
  function demo(conHorario=false) {
    const periodos=['23/2','24/1','24/2','25/1','25/2','26/1'], cantidades=[6,5,7,6,5,8];
    const notas=[7,8,9,8,10,7,8,9,6,8,9,8];
    const a={upiita_saes:1,demo:true,unidad,plan:'19',carrera_nombre:'Carrera ficticia de demostración',leido:'2026-10-09T12:00:00Z',
      materias:{},creditos_materias:{},acreditadas:[],kardex_reprobadas:[],no_cursadas:[],reprobadas_periodo:[],desfasadas_saes:[],en_curso:[],horario_inscrito:[],promedio:8,
      carga:{total:450,min:30,media:60,max:90,duracion:8,duracion_max:12},avance:{obtenidos:370,faltan:80,cursados:6}};
    for(let i=0;i<45;i++){
      const k='Z'+String(i+1).padStart(3,'0'), sem=i<36?1+Math.floor(i/6):i<40?7:8;
      a.materias[k]=['Materia ficticia '+(i+1),sem];
      a.creditos_materias[k]=10;
      if(i<37){
        let p=0, limite=cantidades[0];
        while(i>=limite)limite+=cantidades[++p];
        a.acreditadas.push([k,notas[i%notas.length],periodos[p],i===6?'REC':i===8||i===22?'EXT':i===30?'ETS':'ORD']);
      }
      else a.no_cursadas.push([k,null,0,sem]);
      if(conHorario&&i>=37&&i<42){a.en_curso.push(k);a.horario_inscrito.push(['7FV1',k,a.materias[k][0],['Docente ficticio A','Docente ficticio B'],[[i-37,420,510]]]);}
    }
    a.no_cursadas=a.no_cursadas.filter(r=>!a.en_curso.includes(r[0]));
    // El intento previo al recurse también cuenta en el promedio oficial, pero no duplica créditos.
    a.kardex_reprobadas.push(['Z007',5,'23/2','ORD']);
    const kardex=[...a.acreditadas,...a.kardex_reprobadas];
    a.promedio=Math.round(kardex.reduce((s,r)=>s+r[1],0)/kardex.length*100)/100;
    a.avance.cursados=new Set(kardex.map(r=>r[2])).size;
    a.avance.obtenidos=a.acreditadas.reduce((s,r)=>s+a.creditos_materias[r[0]],0);
    a.avance.faltan=a.carga.total-a.avance.obtenidos;
    return a;
  }
  window.SateGenerico = {datos,demo};
  const esDemo=location.hash==='#demo'||location.hash==='#demo-horario';
  let alumno = esDemo?demo(location.hash==='#demo-horario'):SAES.load(), conectado = false;
  if(esDemo){
    const avisoDemo=document.createElement('div');avisoDemo.className='demo-bar';avisoDemo.textContent='Modo demostración · Perfil ficticio; no se guarda en tu cuenta ni en tus datos del SAES.';
    const salir=document.createElement('button');salir.type='button';salir.className='btn';salir.textContent='Salir del modo demostración';
    salir.onclick=()=>{location.hash='';location.reload()};avisoDemo.appendChild(salir);
    document.body.prepend(avisoDemo);
  }
  function pestañas(){
    const cfg=SATE_CONFIG.unidades[unidad], hay=!!alumno?.horario_inscrito?.length;
    cfg.pestanas=['trayectoria','mapa','calendario',...(hay?['horarios']:[])];cfg.grupos=[['trayectoria'],['mapa','calendario'],...(hay?[['horarios']]:[])];
    const oculta=t=>(SATE_CONFIG.pestanasOcultas||[]).includes(t);cfg.pestanas=cfg.pestanas.filter(t=>!oculta(t));cfg.grupos=cfg.grupos.map(g=>g.filter(t=>!oculta(t))).filter(g=>g.length);
  }
  pestañas();
  const abrir = SAES.open.bind(SAES);
  SAES.open = async () => {
    try {
      await SATE.script('saes-dialogo.js'); SATE.identidadSaes();
      if (!conectado) { SAES.wire(d => {alumno=d;simular=false;notas={};pendientes=false;zoom=null;pestañas();SATE.actualizarPestanas();SATE.repintar();estado()}); conectado=true; }
      estado(); abrir();
    } catch(e) { SATE.error(e); }
  };
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-saes-open]')&&!conectado){e.preventDefault();SAES.open()}});
  $('b-unidad').addEventListener('click',()=>SATE.elegirUnidad());
  function estado() {
    const hay = !!alumno, clave = 'sate.encabezado.'+(hay?'actualizar':'cargar');
    $('saes-open').querySelector('.sate-texto-largo').textContent=SATE.texto(clave);
    $('saes-open').querySelector('.sate-texto-corto').textContent=SATE.texto(clave+'_corto');
    const indicador=$('sate-saes-indicador');indicador.classList.toggle('on',hay);
    const fecha = hay ? new Date(alumno.leido).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}) : '';
    const mensaje=SATE.texto(hay?'sate.encabezado.usando_datos':'sate.encabezado.sin_datos',{fecha});
    indicador.setAttribute('aria-label',mensaje);indicador.title=mensaje;
    if(conectado){$('saes-status').hidden=!hay;$('saes-steps').hidden=hay;$('saes-clear').hidden=!hay;
      $('saes-who').textContent=hay?(alumno.carrera_nombre||'')+' · leídos el '+fecha:'';}
  }
  const aviso = d => '<p class="muted">Tu trayectoria con los datos del SAES.</p>'+(d.viejo&&alumno?'<p role="status">Actualiza tus datos con el Lector para ver los nombres de las materias.</p>':'');
  function representacion(d){
    const cols=Math.max(1,...d.grupos.map(([,ms])=>ms.length)), boxes=[],rows=[];
    d.grupos.forEach(([g,ms],i)=>{rows.push([g,32+i*76]);ms.forEach((m,j)=>boxes.push([150+j*138,10+i*76,128,56,m.clave]));});
    const L={w:150+cols*138,h:Math.max(1,d.grupos.length)*76,boxes,rows,edges:[],pitch:76,filas_exactas:true};
    const porClave=new Map(d.materias.map(m=>[m.clave,m])), curriculum=Object.fromEntries(d.materias.map(m=>[m.clave,[m.nombre,null,m.semestre]]));
    const statusOf=k=>({'Acreditada':'done','En curso':'curso','Reprobada':'fail','Desfasada según el SAES':'late'}[porClave.get(k).estado]||'');
    const ctx={isPersonal:()=>!!alumno,cur:()=>curriculum,
      slotFill:()=>new Map(),isElec:()=>false,statusOf,esc,SATE,soloLectura:true,etiqueta:k=>statusOf(k)==='done'?'Ya acreditada':porClave.get(k).estado,planAsignado:()=>null};
    return {L,ctx,mini:SateUI.minimapaCurricular(ctx,L,new Map())};
  }
  function minimapa(d,abrir=false){
    const mini=representacion(d).mini;
    return '<div class="trayectoria-minimapa">'+(abrir?'<button type="button" data-abrir-mapa aria-label="Abrir mapa curricular">'+mini.svg+'</button>':mini.svg)+'<div class="mm-leg">'+mini.leyenda+'</div></div>';
  }
  let vistaMapa='mapa', pendientes=false, zoom=null;
  function escalaMapa(L){
    const ancho=$('mapwrap').clientWidth||$('v-tray').clientWidth||1000;
    return Math.max(ancho>720?.2:.6,(ancho-2)/L.w);
  }
  function cuadricula(d){
    const {L,ctx}=representacion(d);
    // El ancho se mide después de montar la vista; en teléfono se conserva el desplazamiento para leer las cajas.
    const sc=zoom??escalaMapa(L);
    return '<div class="map" style="position:relative;width:'+L.w*sc+'px;height:'+L.h*sc+'px">'+
      '<svg width="'+L.w*sc+'" height="'+L.h*sc+'" viewBox="0 0 '+L.w+' '+L.h+'" aria-hidden="true">'+L.rows.map(([n,y],i)=>'<rect class="band" x="0" y="'+(i*76)+'" width="'+L.w+'" height="76"/><text class="rowlbl" x="12" y="'+y+'">'+esc(n)+'</text>').join('')+'</svg>'+
      L.boxes.map(([x,y,w,h,k])=>SateUI.cajaMateria(ctx,k,x,y,w,h,sc)).join('')+'</div>';
  }
  function vacio() {return '<p>Usa el Lector desde el SAES de tu unidad y pega tus datos para ver tu trayectoria.</p><button class="btn primary" type="button" data-saes-open>Cargar datos del SAES</button>'}
  function mapa() {
    const d=datos(alumno);
    if(!alumno||!d.materias.length){$('v-tray').innerHTML='<h2>Mapa curricular</h2>'+aviso(d)+(alumno?'<p>El SAES no informó materias. Actualiza tus datos con el Lector.</p>':vacio());return}
    const {mini}=representacion(d), mostrar=pendientes?{...d}:d;
    // Filtrar la representación, conservando el estado real y los grupos del SAES.
    if(pendientes){mostrar.materias=d.materias.filter(m=>m.estado!=='Acreditada');mostrar.grupos=d.grupos.map(([g,ms])=>[g,ms.filter(m=>m.estado!=='Acreditada')]).filter(([,ms])=>ms.length);}
    $('v-tray').innerHTML='<h2>Mapa curricular</h2>'+aviso(d)+
      '<div class="maptools"><div class="seg" role="group" aria-label="Vista de la trayectoria">'+['mapa','lista'].map(v=>'<button type="button" data-mview="'+v+'" aria-pressed="'+(vistaMapa===v)+'">'+(v==='mapa'?'Mapa':'Lista')+'</button>').join('')+'</div>'+
      '<div class="seg" role="group" aria-label="Zoom" id="zoomseg"'+(vistaMapa==='lista'?' hidden':'')+'><button type="button" data-zoom="-1" aria-label="Alejar">−</button><button type="button" data-zoom="0">Mapa completo</button><button type="button" data-zoom="1" aria-label="Acercar">+</button></div></div>'+
      '<div class="legend" aria-label="Simbología">'+mini.leyenda+'</div>'+
      '<div class="mapcut" id="mapcut"><button class="minimap" type="button" data-vista="todo" aria-label="Avance completo en miniatura; muestra el mapa completo">'+mini.svg+'</button><div class="mapcut-info"><b>Tu avance</b><span>'+mini.cnt.done+' de '+d.materias.length+' materias acreditadas</span><span class="mm-leg">'+mini.leyenda+'</span><div class="seg sm mapvista" role="group" aria-label="Qué mostrar del mapa">'+[['todo','Mapa completo'],['pend','Pendientes']].map(([v,n])=>'<button type="button" data-vista="'+v+'" aria-pressed="'+(pendientes===(v==='pend'))+'">'+n+'</button>').join('')+'</div></div></div>'+
      '<div class="mapwrap" id="mapwrap"'+(vistaMapa==='lista'?' hidden':'')+'></div><div class="tlist"'+(vistaMapa==='mapa'?' hidden':'')+'>'+mostrar.grupos.map(([g,ms])=>'<section class="tl-sem"><h4>'+esc(g)+'</h4><div class="tl-rows">'+ms.map(m=>'<div class="tl-row'+(m.estado==='Acreditada'?' done':'')+'"><span class="tl-bar"></span><span class="tl-name"><b>'+esc(m.nombre)+'</b><small>'+esc(m.clave)+'</small></span><span>'+esc(m.estado==='Acreditada'?'Ya acreditada':m.estado)+'</span></div>').join('')+'</div></section>').join('')+'</div>';
    $('mapwrap').innerHTML=mostrar.materias.length?cuadricula(mostrar):'<p>Ya acreditaste todas las materias informadas.</p>';
  }

  const fmtCr=v=>numero(v)==null?'Sin dato del SAES':String(Math.round(v*100)/100);
  const info=t=>'<span class="info" title="'+esc(t)+'" aria-label="'+esc(t)+'">ⓘ</span>';
  const perIdx=p=>{const m=String(p||'').match(/^(\d{2,4})\/([12])$/);return m?(+m[1]%100)*2+(+m[2]-1):null};
  const perName=p=>String(Math.floor(p/2)).padStart(2,'0')+'/'+(p%2+1);
  const formas={ORD:'Ordinario',EXT:'Extraordinario',ETS:'ETS',REC:'Recurse',EQV:'Equivalencia',REV:'Revalidación',DIC:'Dictamen'};
  let simular=false, notas={}, metaPeriodos=4, metaPromedio=8.5;
  const secciones={};
  const abierto=(id,inicial=true)=>(secciones[id]??(inicial&&$('sate-trayectoria').clientWidth>720))?' open':'';
  function estadisticas(a,d){
    const mean=xs=>xs.length?xs.reduce((s,n)=>s+n,0)/xs.length:null;
    const nombres=new Map(d.materias.map(m=>[m.clave,m.nombre])), unicas=new Map();
    for(const r of a.acreditadas||[])if(numero(r[1])>=6&&numero(r[1])<=10)unicas.set(r[0],r);
    const rows=[...unicas.values()].map(([clave,cal,p,codigo])=>({clave,nombre:nombres.get(clave)||clave,cal:+cal,per:perIdx(p),codigo:String(codigo||'').toUpperCase(),cr:numero(a.creditos_materias?.[clave])}));
    const curso=d.materias.filter(m=>m.estado==='En curso');
    if(simular)for(const m of curso)rows.push({clave:m.clave,nombre:m.nombre,cal:notas[m.clave]??8,per:null,codigo:'ORD',cr:numero(a.creditos_materias?.[m.clave]),sim:true});
    rows.forEach(r=>{r.eqv=['EQV','REV','DIC'].includes(r.codigo);r.forma=formas[r.codigo]||'No identificada'});
    const reales=rows.filter(r=>!r.sim), reg=reales.filter(r=>!r.eqv&&r.per!=null);
    const porPer=[...new Set(reg.map(r=>r.per))].sort((a,b)=>a-b).map(per=>{const rs=reg.filter(r=>r.per===per);return {per,lbl:perName(per),prom:mean(rs.map(r=>r.cal)),n:rs.length,cr:rs.every(r=>r.cr!=null)?rs.reduce((s,r)=>s+r.cr,0):null}});
    const valores=rows.map(r=>r.cal).sort((a,b)=>a-b), media=mean(valores), mediana=valores.length?(valores[(valores.length-1)>>1]+valores[valores.length>>1])/2:null;
    const evaluadas=rows.filter(r=>['ORD','EXT','ETS','REC'].includes(r.codigo));
    const ultimos=porPer.slice(-3), ritmo=ultimos.length&&ultimos.every(p=>p.cr!=null)?mean(ultimos.map(p=>p.cr)):null;
    const total=numero(a.carga?.total), base=numero(a.avance?.obtenidos), saldo=numero(a.avance?.faltan);
    const extras=rows.filter(r=>r.sim), simCr=extras.every(r=>r.cr!=null)?extras.reduce((s,r)=>s+r.cr,0):null;
    const consistente=total!=null&&base!=null&&saldo!=null&&Math.abs(total-base-saldo)<.01;
    const obt=base!=null&&simCr!=null&&(!simular||consistente&&simCr<=saldo)?base+simCr:simular?null:base;
    const falta=consistente&&simCr!=null&&simCr<=saldo?saldo-simCr:null;
    let acum=0;
    const cobertura=reales.every(r=>r.cr!=null&&(r.eqv||r.per!=null))&&consistente&&Math.abs(reales.reduce((s,r)=>s+r.cr,0)-base)<.01;
    if(cobertura)acum=reales.filter(r=>r.eqv).reduce((s,r)=>s+r.cr,0);
    const curva=cobertura?porPer.map(p=>({...p,acum:acum+=p.cr})):[];
    const actual=porPer.at(-1)?.per??null, meta=actual!=null?actual+1:null;
    const nper=falta===0?0:ritmo>0&&falta!=null?Math.ceil(falta/ritmo):null, fin=nper>0&&meta!=null?meta+nper-1:null;
    const avisos=[];
    if(reales.some(r=>r.cr==null))avisos.push('El SAES no informó créditos por materia. No se pueden calcular créditos por periodo ni estimar tu ritmo.');
    else if(!cobertura)avisos.push('El kárdex no permite distribuir el saldo del SAES por periodo.');
    if(!consistente)avisos.push('Saldo de créditos sin confirmar: actualiza tus datos del SAES.');
    if(simular&&extras.some(r=>r.cr==null))avisos.push('La simulación de promedio está disponible; faltan créditos de las materias inscritas para simular el avance.');
    return {rows,porPer,media,mediana,sd:valores.length>1?Math.sqrt(valores.reduce((s,v)=>s+(v-media)**2,0)/(valores.length-1)):null,
      ord:evaluadas.length?evaluadas.filter(r=>r.codigo==='ORD').length/evaluadas.length:null,formasN:evaluadas.length,formasExcluidas:rows.length-evaluadas.length,
      delta:porPer.length>1?porPer.at(-1).prom-porPer.at(-2).prom:null,ritmo,ritmoN:ultimos.length,total,obt,falta,simCr,simulado:simular,curva,actual,meta,nper,fin,avisos,curso};
  }
  window.SateGenerico.estadisticas=estadisticas;
  function proyeccionCreditos(D){
    if(!(D.ritmo>0)||D.obt==null||D.meta==null||D.nper==null)return [];
    return [{acum:D.obt,per:D.meta-1},...Array.from({length:Math.min(200,D.nper)},(_,i)=>({acum:Math.min(D.total,D.obt+(i+1)*D.ritmo),per:D.meta+i}))];
  }
  function escenario(D){
    const necesarias=D.falta!=null?D.falta/metaPeriodos:null, n=D.rows.filter(r=>!r.sim).length, promedio=D.rows.filter(r=>!r.sim).reduce((s,r)=>s+r.cal,0);
    const objetivo=D.curso.length?(metaPromedio*(n+D.curso.length)-promedio)/D.curso.length:null;
    return '<details class="trayectoria-plegable" id="trayectoria-escenario"'+abierto('trayectoria-escenario')+'><summary>¿Y si…?</summary><div>'+
      '<section class="meta-panel"><h3>¿En cuántos periodos quieres terminar?</h3><div class="meta-controls"><label>Periodos <input id="gen-meta-periodos" type="number" min="1" step="1" value="'+metaPeriodos+'"></label></div><p aria-live="polite">'+(necesarias!=null?fmtCr(necesarias)+' créditos por periodo. '+(numero(alumno.carga?.max)!=null&&necesarias>alumno.carga.max?'Rebasa la carga máxima del SAES.':'Confirma tu carga autorizada con Gestión Escolar.'):'Faltan créditos consistentes del SAES para calcular esta meta.')+'</p></section>'+
      '<section class="meta-panel pm"><h3>¿Qué promedio quieres alcanzar?</h3><div class="meta-controls"><label>Promedio meta <input id="gen-meta-promedio" type="number" min="6" max="10" step="0.1" value="'+metaPromedio+'"></label></div><p aria-live="polite">'+(objetivo!=null?'Necesitas promediar '+objetivo.toFixed(2)+' en tus '+D.curso.length+' materias inscritas'+(objetivo>10?' · No alcanzable este periodo.':objetivo<=6?' · Cualquier calificación aprobatoria alcanza.':'.'):'No tienes materias inscritas informadas para calcular la meta.')+'</p></section>'+
      '<details class="sate-desp" id="gen-simulacion"'+abierto('gen-simulacion',false)+'><summary>Simular fin de semestre</summary><div class="est-sim"><label class="tgl"><input id="gen-sim" type="checkbox"'+(simular?' checked':'')+'><span class="tgl-ui" aria-hidden="true"></span>Activar simulación</label><p class="sim-hint">Escenario ficticio; tus datos del SAES se conservan.</p><div class="simrows'+(simular?'':' off')+'">'+D.curso.map(m=>'<label class="simrow"><span class="sim-n">'+esc(m.nombre)+'</span><select data-gen-nota="'+esc(m.clave)+'"'+(simular?'':' disabled')+' aria-label="Calificación de '+esc(m.nombre)+'">'+[10,9,8,7,6].map(v=>'<option'+((notas[m.clave]??8)===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>').join('')+'</div></div></details></div></details>';
  }
  function trayectoria() {
    const d=datos(alumno), a=alumno;
    if(!a){$('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2>'+vacio();return}
    const D=estadisticas(a,d), plazo={max:numero(a.carga?.duracion_max),dur:numero(a.carga?.duracion)}, cursados=numero(a.avance?.cursados);
    const totalPer=D.nper!=null&&cursados!=null?cursados+D.nper:null;
    const ec=D.curso.every(m=>numero(a.creditos_materias?.[m.clave])!=null)?D.curso.reduce((s,m)=>s+numero(a.creditos_materias[m.clave]),0):0;
    const camino=SateUI.caminoTrayectoria(D,a,plazo,totalPer,{esc,fmtCr,perName,proyeccionCreditos,ec:simular?0:ec,info},$('sate-trayectoria').clientWidth||600);
    const periodos=[...new Set(D.rows.filter(r=>!r.eqv).map(r=>r.per))].sort((a,b)=>(a??Infinity)-(b??Infinity));
    const col=(t,rs)=>SateUI.fichasKardex(t,rs.length+' '+(rs.length===1?'materia':'materias')+' · promedio '+(rs.reduce((s,r)=>s+r.cal,0)/rs.length).toFixed(2)+(rs.every(r=>r.cr!=null)?' · '+fmtCr(rs.reduce((s,r)=>s+r.cr,0))+' cr':''),rs,esc);
    const eq=D.rows.filter(r=>r.eqv);
    const kardex='<div class="kx">'+(eq.length?col('Equivalencias',eq):'')+periodos.map(p=>col(p==null?'Sin periodo':perName(p),D.rows.filter(r=>!r.eqv&&r.per===p))).join('')+'</div>';
    const desfase=(a.desfasadas_saes||[]).length?'Desfasadas según el SAES: '+(a.desfasadas_saes||[]).length:a.desfasadas_saes!=null?'El SAES no lista materias desfasadas.':'Desfase sin confirmar: actualiza el Estado General con el Lector.';
    $('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2><div id="sate-presente"><p class="trayectoria-resumen">'+esc(a.carrera_nombre||'')+(a.plan?' · Plan '+esc(a.plan):'')+' · '+(D.total>0&&numero(a.avance?.obtenidos)!=null?Math.round(a.avance.obtenidos/D.total*100)+' % de avance':'Avance sin informar')+'</p>'+minimapa(d,true)+
      '<div class="trayectoria-datos"><p>'+esc(desfase)+'</p><p>Promedio del SAES: '+dato(a.promedio)+'</p><p>Periodos cursados: '+dato(a.avance?.cursados)+' · Duración: '+dato(a.carga?.duracion)+' · Duración máxima: '+dato(a.carga?.duracion_max)+'</p><p>Carga mínima: '+dato(a.carga?.min)+' · Media: '+dato(a.carga?.media)+' · Máxima: '+dato(a.carga?.max)+'</p></div></div>'+aviso(d)+
      '<div class="kstats" id="kstats">'+(D.avisos.length?'<p class="st-note">'+D.avisos.map(esc).join(' ')+'</p>':'')+SateUI.indicadoresTrayectoria(D,{esc,fmtCr,info,SATE})+
      '<div class="charts"><figure class="ch-wide"><figcaption><b>Tu camino en la carrera'+(simular?' · simulado':'')+'</b>'+SateUI.leyendaGrafica([['cuadro','var(--accent)','Acreditado'],['rayado','var(--accent)',simular?'Simulado':'En curso'],['cuadro','var(--line)','Te falta'],['marca','var(--accent)','Estimado a tu ritmo']],esc)+'</figcaption><div id="ch-camino">'+camino+'</div></figure></div>'+
      '<details class="trayectoria-plegable" id="trayectoria-kardex"'+abierto('trayectoria-kardex')+'><summary>Tu kárdex por periodo<small>'+D.rows.length+' materias acreditadas</small></summary><div class="charts"><figure class="ch-wide"><figcaption>'+SateUI.leyendaGrafica([['grado','','Calificación'],['letra','E','Extraordinario'],['letra','T','ETS'],['letra','R','Recurse']],esc)+'</figcaption><div id="ch-kx">'+kardex+'</div></figure></div></details>'+escenario(D)+'</div>';
    if(D.avisos.length)console.debug('SATE genérico: cobertura de analítica',{unidad,materias:D.rows.length,periodos:D.porPer.length,avisos:D.avisos});
  }
  document.querySelector('.sate-controles').hidden=true;
  document.querySelector('.bar-top').hidden=true;
  document.body.setAttribute('data-sate-generico','true');
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-abrir-mapa]'))SATE.ir('mapa');
    if(e.target.closest?.('[data-demo-open]')){location.hash='#demo';location.reload()}
    const vista=e.target.closest?.('[data-mview]'), foco=e.target.closest?.('[data-vista]'), z=e.target.closest?.('[data-zoom]');
    if(vista){vistaMapa=vista.dataset.mview;mapa()}
    if(foco){pendientes=foco.dataset.vista==='pend';zoom=null;mapa()}
    if(z){const paso=+z.dataset.zoom;zoom=paso===0?null:Math.max(.2,Math.min(10,(zoom??escalaMapa(representacion(datos(alumno)).L))*(paso>0?1.2:1/1.2)));mapa()}
  });
  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='gen-sim'){simular=t.checked;trayectoria()}
    if(t.dataset?.genNota&&Number.isInteger(+t.value)&&+t.value>=6&&+t.value<=10){notas[t.dataset.genNota]=+t.value;trayectoria()}
    if(t.id==='gen-meta-periodos'&&Number.isSafeInteger(+t.value)&&+t.value>0){metaPeriodos=+t.value;trayectoria()}
    if(t.id==='gen-meta-promedio'&&+t.value>=6&&+t.value<=10){metaPromedio=+t.value;trayectoria()}
  });
  document.addEventListener('toggle',e=>{if(['trayectoria-kardex','trayectoria-escenario','gen-simulacion'].includes(e.target.id))secciones[e.target.id]=e.target.open},true);
  window.addEventListener('resize',()=>{if(SATE.actual?.pestana==='mapa')mapa()});
  function horario(){
    const H=alumno?.horario_inscrito||[];
    const all=H.map(([g,k,n,p,ses],i)=>Object.assign([null,null,null,g],{g,k,n,p,ses:(ses||[]).filter(([d,a,b])=>Number.isInteger(d)&&d>=0&&d<7&&Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>a&&b<=1440),i}));
    const DAYS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
    // La misma secuencia de tonos que Horarios, con índice estable por materia y no por grupo.
    const claves=[...new Set(all.map(c=>c.k))], hue=c=>(claves.indexOf(c.k)*137.508)%360;
    $('v-hor').innerHTML='<h2>Tu horario inscrito</h2><p class="muted">Horario del SAES · Solo lectura</p><div class="calwrap"><div id="cal" class="cal"></div></div><div class="summary"><table class="horario-inscrito"><caption>Materias inscritas</caption><thead><tr><th scope="col">Materia</th><th scope="col">Grupo</th><th scope="col">Profesor(es)</th><th scope="col">Días y horas</th></tr></thead><tbody>'+all.map(c=>'<tr style="--h:'+hue(c)+'"><td data-label="Materia"><span class="sw"></span><b>'+esc(c.n)+'</b><small>'+esc(c.k)+'</small></td><td data-label="Grupo">'+esc(c.g)+'</td><td data-label="Profesor(es)">'+esc(Array.isArray(c.p)?c.p.join(', '):c.p||'Profesor sin informar')+'</td><td data-label="Días y horas">'+(c.ses.length?c.ses.map(([d,a,b])=>DAYS[d]+' '+hm(a)+'–'+hm(b)).join('<br>'):'Sin horario informado')+'</td></tr>').join('')+'</tbody></table></div>';
    SateUI.cuadriculaHorario(all,{S:{weekend:false},slots:c=>c.ses,START:420,BLOCK:90,SLOT:30,SLOTPX:22,
      $:s=>document.querySelector(s),DAYS,hm,
      esc,hue,keyOf:c=>c.k,name:c=>c.n,profs:c=>Array.isArray(c.p)?c.p.join(', '):c.p||'',roomAt:()=>'',soloLectura:true});
  }
  SATE.presente={avisos(){}};
  SATE.pestana('mapa',{mostrar:mapa});SATE.pestana('trayectoria',{mostrar:trayectoria});
  SATE.pestana('horarios',{mostrar:horario});
  SATE.alumno=()=>alumno;
  if(!esDemo)IPNT.set('ipnt.unidad',unidad);
  SATE.nucleoListo({personal:()=>!!alumno,estado:{},renderTop:estado,renderAviso(){},
    store:{set:(k,v)=>IPNT.set('hu.'+unidad+'.'+k,JSON.stringify(v))}}).catch(SATE.error);
})();
