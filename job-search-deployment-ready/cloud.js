(function () {
  const config = window.JOB_SEARCH_CONFIG || {};
  let client = null, currentUser = null, timer = null, syncing = false, pending = false;
  const configured = !!(config.supabaseUrl && config.supabaseAnonKey);
  if (configured && window.supabase) {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  const originalSave = save;
  save = function () { originalSave(); if (currentUser) queuePush(); };
  function queuePush() { pending = true; clearTimeout(timer); timer = setTimeout(push, 700); }
  async function push() {
    if (!client || !currentUser || syncing || !pending) return;
    syncing = true; pending = false;
    const payload = JSON.parse(JSON.stringify(data));
    const {error} = await client.from('workspaces').upsert({
      user_id: currentUser.id, payload, updated_at: new Date().toISOString()
    }, {onConflict:'user_id'});
    syncing = false;
    if (error) { pending = true; status('Sync failed — local backup retained'); console.error(error); }
    else status('Synced securely');
    if (pending && !error) queuePush();
  }
  function status(msg) { const x=document.getElementById('cloud-status'); if(x)x.textContent=msg; }
  function ensureControl() {
    if(document.getElementById('cloud-widget'))return;
    const el=document.createElement('div');el.id='cloud-widget';
    el.style.cssText='position:fixed;bottom:16px;right:16px;z-index:8;background:#181a18;color:white;padding:10px 12px;border-radius:12px;box-shadow:0 8px 30px #0002;font:12px system-ui;max-width:calc(100vw - 32px)';
    el.innerHTML='<div id="cloud-status" style="margin-bottom:7px">Checking cloud connection…</div><button id="cloud-button" style="background:#d7ff70;border:0;border-radius:7px;padding:7px 10px;cursor:pointer">Cloud account</button>';
    document.body.appendChild(el);
    document.getElementById('cloud-button').addEventListener('click',openAccount);
  }
  function openAccount() {
    let overlay=document.getElementById('overlay');
    overlay.innerHTML=`<div class="dialogback" onclick="if(event.target===this)closeDialog()"><div class="dialog" style="max-width:480px">
      <div class="dialogheader"><h2>Cloud workspace</h2><button class="close" onclick="closeDialog()">✕</button></div>
      <p class="sub" style="margin-bottom:18px">${currentUser?'Signed in as '+esc(currentUser.email):'Sign in to synchronize your job search across devices.'}</p>
      ${!client?'<div class="note">Cloud sync is not configured. Add your Supabase project URL and publishable key to config.js after creating the database table.</div>':
      currentUser?'<button class="btn" id="cloud-signout">Sign out</button>':
      '<div class="formfield"><label>Email address</label><input id="cloud-email" type="email" class="field" placeholder="you@example.com"></div><button class="btn primary" style="margin-top:12px" id="cloud-login">Send sign-in link</button><p class="tiny" style="margin-top:12px">A secure magic link will be emailed to you. Configure your deployed URL in Supabase Auth redirect settings.</p>'}
      <div id="cloud-message" class="tiny" style="margin-top:12px"></div></div></div>`;
    if(client && !currentUser)document.getElementById('cloud-login').onclick=async()=>{
      const email=document.getElementById('cloud-email').value.trim();
      if(!email)return;
      const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
      document.getElementById('cloud-message').textContent=error?error.message:'Check your inbox for the sign-in link.';
    };
    if(client && currentUser)document.getElementById('cloud-signout').onclick=async()=>{await client.auth.signOut();closeDialog();};
  }
  async function onUser(user) {
    currentUser=user;ensureControl();
    if(!user){status(client?'Local mode · Sign in to sync':'Local mode · Cloud not configured');return;}
    status('Loading cloud workspace…');
    const {data:row,error}=await client.from('workspaces').select('payload').eq('user_id',user.id).maybeSingle();
    if(error){status('Could not load cloud data');console.error(error);return;}
    if(row && row.payload && Array.isArray(row.payload.applications) && Array.isArray(row.payload.companies)){
      const localHasData=data.applications.length>0||data.companies.some(c=>!['c1','c2','c3','c4'].includes(c.id));
      if(localHasData && JSON.stringify(data)!==JSON.stringify(row.payload) &&
         confirm('Cloud data exists. Press OK to load cloud data, or Cancel to keep your local data and upload it to cloud.')) {
        data=row.payload;originalSave();render();
      } else if(!localHasData) {data=row.payload;originalSave();render();}
      else {queuePush();}
    } else {queuePush();}
    status('Cloud connected · '+user.email);
  }
  ensureControl();
  if(client){
    client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>onUser(session?.user||null),0)});
  }else status('Local mode · Cloud not configured');
})();
