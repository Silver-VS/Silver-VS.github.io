/* Sin plan cargado: conservar el SAES como fuente, sin completar datos académicos por inferencia. */
window.IPNT_UNIDAD = window.SATE_UNIDAD;

/* ---------- perfil IPN-tools: respaldo y sincronización con la cuenta institucional (tools/cuenta.py) ---------- */
var IPNT=window.IPNT=(()=>{
  const CFG={"clientId": "7e8e5a95-4337-4652-8b07-3450306cda8f", "tenant": "common", "googleClientId": "959269733-d3h3qm0dtqpshebnabum1jr2g0l6geoa.apps.googleusercontent.com", "unidades": [{"id": "upiita", "siglas": "UPIITA", "nombre": "Unidad Profesional Interdisciplinaria en Ingenier\u00eda y Tecnolog\u00edas Avanzadas", "disponible": true, "url": "horarios-upiita.html"}, {"id": "escom", "siglas": "ESCOM", "nombre": "Escuela Superior de C\u00f3mputo", "disponible": true, "url": "horarios-escom.html"}, {"id": "upibi", "siglas": "UPIBI", "nombre": "Unidad Profesional Interdisciplinaria de Biotecnolog\u00eda", "disponible": true, "url": "horarios-upibi.html"}], "googlePrueba": true, "contacto": "vacevess1900@alumno.ipn.mx", "institucionalPendiente": true, "version": "1.2.0", "unidad": window.SATE_UNIDAD, "msal": "https://cdn.jsdelivr.net/npm/@azure/msal-browser@4.30.0/lib/msal-browser.min.js", "sri": "sha384-RGxxfG5yRS8DLU7ZJ8OoLhbV/BsJFHyPuMVHrTLbpj3t5Z15LnviJmaznKY/a7LZ"}, FILE='perfil.ipnt.json', MS_SCOPES=['Files.ReadWrite.AppFolder'],
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
      if((d.unidad||'upiita')!==SAES.U()){msg.innerHTML='<span class="bad">Estos datos son del SAES de '+String(d.unidad||'upiita').toUpperCase()+'. Esta página es de la '+SAES.U().toUpperCase()+'.</span>';return}
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

(function () {
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
  window.SateGenerico = {datos};
  let alumno = SAES.load(), conectado = false;
  const abrir = SAES.open.bind(SAES);
  SAES.open = async () => {
    try {
      await SATE.script('saes-dialogo.js'); SATE.identidadSaes();
      if (!conectado) { SAES.wire(d => {alumno=d;SATE.repintar();estado()}); conectado=true; }
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
  const aviso = d => '<p class="muted">Armado con tus datos del SAES; sin seriación ni oferta.</p>'+(d.viejo&&alumno?'<p role="status">Actualiza tus datos con el Lector para ver los nombres de las materias.</p>':'');
  function tira(d, mini=false) {
    return '<div class="generico-tira'+(mini?' generico-mini':'')+'">'+d.grupos.map(([g,ms])=>'<section><h3>'+esc(g)+'</h3>'+ms.map(m=>'<div class="generico-materia" style="border-left-color:'+m.color+'"><b>'+esc(m.nombre)+'</b><small>'+esc(m.clave)+' · '+esc(m.estado)+'</small></div>').join('')+'</section>').join('')+'</div>';
  }
  function vacio() {return '<p>Usa el Lector desde el SAES de tu unidad y pega tus datos para ver tu trayectoria.</p><button class="btn primary" type="button" data-saes-open>Cargar datos del SAES</button>'}
  function mapa() {
    const d=datos(alumno);
    $('v-tray').innerHTML='<h2>Mapa curricular</h2>'+aviso(d)+(alumno?(d.materias.length?tira(d):'<p>El SAES no informó materias. Actualiza tus datos con el Lector.</p>'):vacio());
  }
  function trayectoria() {
    const d=datos(alumno), a=alumno;
    if(!a){$('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2>'+vacio();return}
    const total=numero(a.carga?.total), obtenidos=numero(a.avance?.obtenidos);
    const avance=total>0&&obtenidos!=null?'<progress max="'+total+'" value="'+Math.min(total,obtenidos)+'" aria-label="Avance en créditos"></progress> '+Math.round(obtenidos/total*100)+' %':'';
    const periodos=new Map();
    for(const r of [...a.acreditadas||[],...a.kardex_reprobadas||[]]){
      const p=r[2]||'Sin periodo informado';if(!periodos.has(p))periodos.set(p,[]);periodos.get(p).push(r);
    }
    const nombres=new Map(d.materias.map(m=>[m.clave,m.nombre]));
    const kardex=[...periodos].sort((a,b)=>a[0].localeCompare(b[0],'es',{numeric:true})).map(([p,rs])=>'<details class="sate-desp" open><summary>Periodo '+esc(p)+'</summary><div class="generico-calificaciones">'+rs.map(r=>'<p><b>'+esc(nombres.get(r[0])||r[0])+'</b> <small>'+esc(r[0])+'</small><br>Calificación: '+esc(r[1])+' · '+esc(r[3]||'Forma de evaluación sin informar')+'</p>').join('')+'</div></details>').join('');
    const desfase=(a.desfasadas_saes||[]).length?'<p>Desfasadas según el SAES: '+(a.desfasadas_saes||[]).map(r=>esc(nombres.get(r[0])||r[0])).join(', ')+'.</p>':a.desfasadas_saes!=null?'<p>El SAES no lista materias desfasadas.</p>':'<p>Desfase sin confirmar: actualiza el Estado General con el Lector.</p>';
    $('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2><p>'+esc(a.carrera_nombre||'')+(a.plan?' · Plan '+esc(a.plan):'')+'</p>'+aviso(d)+
      '<section><h3>Avance y promedio</h3>'+avance+'<p>Créditos obtenidos: '+dato(a.avance?.obtenidos)+' · Por obtener: '+dato(a.avance?.faltan)+' · Total: '+dato(a.carga?.total)+'</p><p>Promedio del SAES: '+dato(a.promedio)+'</p></section>'+desfase+(a.desfase_saes?'<p>'+esc(a.desfase_saes)+'</p>':'')+
      (d.materias.length?'<details class="sate-desp" open><summary>Minimapa de avance</summary>'+tira(d,true)+'</details>':'')+
      '<section><h3>Plazos y carga del SAES</h3><p>Periodos cursados: '+dato(a.avance?.cursados)+' · Duración: '+dato(a.carga?.duracion)+' · Duración máxima: '+dato(a.carga?.duracion_max)+'</p><p>Carga mínima: '+dato(a.carga?.min)+' · Media: '+dato(a.carga?.media)+' · Máxima: '+dato(a.carga?.max)+'</p>'+(a.avance?.autorizada?'<p>Carga autorizada: '+esc(a.avance.autorizada)+'</p>':'')+'</section>'+
      '<h3>Kárdex y calificaciones por periodo</h3>'+(kardex||'<p>El SAES no informó calificaciones por periodo.</p>');
  }
  document.querySelector('.sate-controles').hidden=true;
  document.querySelector('.bar-top').hidden=true;
  const css=document.createElement('style');css.textContent='.generico-tira{display:flex;gap:12px;overflow-x:auto;padding:12px 0;max-width:100%}.generico-tira>section{flex:0 0 230px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px}.generico-tira h3{font-size:1rem;margin:0 0 12px}.generico-materia{border-left:5px solid;margin:8px 0;padding:6px 8px;overflow-wrap:anywhere}.generico-materia small{display:block}.generico-mini>section{flex-basis:180px}.generico-mini{font-size:.85rem}.generico-calificaciones{padding:12px}';document.head.appendChild(css);
  SATE.presente={avisos(){}};
  SATE.pestana('mapa',{mostrar:mapa});SATE.pestana('trayectoria',{mostrar:trayectoria});
  SATE.alumno=()=>alumno;
  IPNT.set('ipnt.unidad',unidad);
  SATE.nucleoListo({personal:()=>!!alumno,estado:{},renderTop:estado,renderAviso(){},
    store:{set:(k,v)=>IPNT.set('hu.'+unidad+'.'+k,JSON.stringify(v))}}).catch(SATE.error);
})();
