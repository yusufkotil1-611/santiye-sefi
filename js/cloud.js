/* Şantiye Şefi — bulut katmanı: Supabase girişi, RPC çağrıları, senkron motoru bağlantısı
   (js/config.js boşsa hiçbir şey yapmaz; uygulama yerel kipte çalışmaya devam eder)

   Çevrimdışı ilke: yerel veri her zaman esastır. Oturum açıldıktan sonra uygulama internetsiz açılabilir;
   lisans bilgisi son başarılı kontrolden itibaren 14 gün çevrimdışı geçerlidir (sonra bağlanmak gerekir).
   NOT: Bu istemci denetimi yalnızca kullanıcı deneyimi içindir; asıl zorlama sunucudadır (RLS / RPC). */
(function () {
  const SS = window.SS, U = SS.U;
  const cfg = window.SS_CONFIG || {};
  const C = (SS.cloud = { enabled: false, engine: null, status: { state: 'idle', pending: 0, notices: [] }, ws: null, info: null, user: null });
  C.enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase && window.supabase.createClient);
  if (!C.enabled) return;

  const OFFLINE_GRACE_MS = 14 * 24 * 3600 * 1000;
  const LS = { cache: 'santiyesefi.cloud.v1', activeWs: 'santiyesefi.activeWs', authKey: 'santiyesefi.auth', adopted: 'santiyesefi.legacy.adopted' };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* dolu / kapalı */ } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* */ } };

  const client = (C.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: LS.authKey },
  }));

  /* ---------- hata iletileri ---------- */
  const MSG = {
    not_authenticated: 'Oturum süreniz doldu, yeniden giriş yapın', email_not_verified: 'E-posta adresiniz henüz doğrulanmadı',
    not_member: 'Bu firmanın üyesi değilsiniz', forbidden: 'Bu işlem için yetkiniz yok', license_readonly: 'Lisans askıda: değişiklik yapılamaz',
    terminal_limit: 'Satın aldığınız terminal sayısı dolu', viewer_limit: 'İzleyici hakkınız dolu', role_not_in_plan: 'Paketiniz bu role izin vermiyor',
    project_limit: 'Paketinizdeki aktif şantiye sınırına ulaştınız', workspace_limit: 'En fazla 3 firma oluşturabilirsiniz',
    invite_invalid: 'Davet kodu geçersiz veya kullanılmış', invite_expired: 'Davetin süresi dolmuş', invite_email_mismatch: 'Bu davet başka bir e-posta adresi için gönderilmiş',
    already_member: 'Bu kişi zaten firmada', member_not_found: 'Üye bulunamadı', invalid_name: 'Ad en az 2 karakter olmalı', invalid_email: 'E-posta adresi geçersiz',
    invalid_role: 'Geçersiz rol', invalid_device: 'Cihaz kaydı geçersiz', device_revoked: 'Bu cihaz çıkarıldı', device_unknown: 'Cihaz kayıtlı değil', storage_quota: 'Depolama kotanız doldu',
    invalid_blob: 'Dosya kaydı geçersiz', invalid_batch: 'Geçersiz istek',
  };
  const AUTHMSG = [
    [/Invalid login credentials/i, 'E-posta veya şifre hatalı'],
    [/Email not confirmed/i, 'E-posta adresiniz henüz doğrulanmadı — gelen kutunuzdaki bağlantıya tıklayın'],
    [/already registered|already been registered/i, 'Bu e-posta adresi zaten kayıtlı — giriş yapmayı deneyin'],
    [/at least \d+ char|weak_password|Password should/i, 'Şifre en az 10 karakter olmalı'],
    [/same.*password|different from the old/i, 'Yeni şifre eskisinden farklı olmalı'],
    [/rate limit|too many|over_.*_rate_limit|security purposes/i, 'Çok sık denediniz, biraz bekleyip tekrar deneyin'],
    [/Failed to fetch|NetworkError|Network request failed|Load failed|fetch failed/i, 'Bağlantı yok — internete bağlanın'],
  ];
  C.msg = (e) => {
    const m = String((e && e.message) || e || '');
    if (MSG[m]) return MSG[m];
    for (const [re, t] of AUTHMSG) if (re.test(m)) return t;
    return m || 'Bir hata oluştu';
  };
  const NET_RE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout/i;
  const wrap = (error) => { const e = new Error(error.message || 'hata'); e.code = error.code; if (NET_RE.test(String(error.message))) e.offline = true; return e; };

  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw wrap(error);
    return data;
  }
  C.rpc = rpc;

  /* ---------- hesap önbelleği (çevrimdışı açılış için) ---------- */
  C.cache = () => { try { return JSON.parse(lsGet(LS.cache) || '{}'); } catch (e) { return {}; } };
  C.saveCache = (patch) => lsSet(LS.cache, JSON.stringify(Object.assign(C.cache(), patch)));

  /* ---------- oturum ---------- */
  /** @returns {{session, offline}}  offline: ağ yok ama daha önce giriş yapılmış (önbellek var) */
  C.init = async () => {
    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data.session) { C.user = data.session.user; return { session: data.session, offline: false }; }
      if (error && NET_RE.test(String(error.message))) throw wrap(error);
    } catch (e) {
      if (e.offline || navigator.onLine === false) {
        const stored = (() => { try { return JSON.parse(lsGet(LS.authKey) || 'null'); } catch (x) { return null; } })();
        const cc = C.cache();
        if (stored && stored.user && cc.userId === stored.user.id) { C.user = stored.user; return { session: stored, offline: true }; }
      }
    }
    return { session: null, offline: false };
  };
  C.onAuth = (fn) => client.auth.onAuthStateChange((event, session) => fn(event, session));

  C.signUp = async (email, password, displayName) => {
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: displayName || '' }, emailRedirectTo: location.origin + location.pathname } });
    if (error) throw wrap(error);
    return { needsConfirm: !data.session, session: data.session };
  };
  C.signIn = async (email, password) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw wrap(error);
    C.user = data.user; return data.session;
  };
  C.resendConfirm = async (email) => { const { error } = await client.auth.resend({ type: 'signup', email }); if (error) throw wrap(error); };
  C.resetPassword = async (email) => { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (error) throw wrap(error); };
  C.updatePassword = async (password) => { const { error } = await client.auth.updateUser({ password }); if (error) throw wrap(error); };

  /* ---------- firmalar / lisans ---------- */
  C.myWorkspaces = async () => {
    try { const list = await rpc('my_workspaces'); C.saveCache({ workspaces: list, userId: C.user && C.user.id, email: C.user && C.user.email }); return { list, offline: false }; }
    catch (e) { if (e.offline) return { list: C.cache().workspaces || [], offline: true }; throw e; }
  };
  C.createWorkspace = (name) => rpc('create_workspace', { p_name: name });
  C.acceptInvite = (token) => rpc('accept_invite', { p_token: String(token || '').trim() });
  C.licenseInfo = async (ws) => {
    try { const i = await rpc('license_info', { p_ws: ws }); C.saveCache({ [`info.${ws}`]: i, [`checked.${ws}`]: Date.now() }); return i; }
    catch (e) { if (e.offline) { e.cached = C.cache()[`info.${ws}`] || null; } throw e; }
  };
  /** Çevrimdışıyken son bilinen lisans bilgisi; 14 günden eskiyse null (bağlanmak gerekir) */
  C.cachedLicense = (ws) => { const c = C.cache(); const t = c[`checked.${ws}`]; return t && Date.now() - t < OFFLINE_GRACE_MS ? c[`info.${ws}`] : null; };
  C.team = (ws) => rpc('list_team', { p_ws: ws });
  /* Davet: `emailInvites` açıksa Edge Function (invite-send) daveti çağıranın yetkisiyle oluşturur VE e-postayla gönderir.
     Fonksiyon yoksa / ulaşılamıyorsa (ağ, dağıtım) doğrudan RPC'ye düşer: kod yine ekranda gösterilir. İş kuralı hataları (terminal dolu vb.) olduğu gibi iletilir. */
  C.invite = async (ws, email, role) => {
    if (cfg.emailInvites && client.functions) {
      const { data, error } = await client.functions.invoke('invite-send', { body: { workspace_id: ws, email, role } });
      if (!error && data && data.token) return { invite_id: data.inviteId, token: data.token, email: data.email, role: data.role, expires_at: data.expiresAt, emailed: !!data.emailed };
      if (error) {
        let code = null;
        try { code = (await error.context.json()).error; } catch (e) { /* gövde yok: ağ/dağıtım sorunu */ }
        if (code && code !== 'server_error') throw new Error(code);
      }
    }
    return rpc('invite_member', { p_ws: ws, p_email: email, p_role: role });
  };
  C.revokeInvite = (id) => rpc('revoke_invite', { p_invite: id });
  C.removeMember = (ws, uid) => rpc('remove_member', { p_ws: ws, p_user: uid });
  C.setRole = (ws, uid, role) => rpc('change_member_role', { p_ws: ws, p_user: uid, p_role: role });
  C.pendingInvites = async (ws) => {
    const { data, error } = await client.from('invites').select('id,email,role,created_at,expires_at,accepted_at,revoked_at').eq('workspace_id', ws).is('accepted_at', null).is('revoked_at', null).order('created_at', { ascending: false });
    if (error) throw wrap(error); return data;
  };
  C.myDevices = async (ws) => {
    const { data, error } = await client.from('devices').select('id,label,platform,device_key,last_seen_at,revoked_at').eq('workspace_id', ws).order('last_seen_at', { ascending: false });
    if (error) throw wrap(error); return data;
  };
  C.profile = async () => {
    const { data, error } = await client.from('profiles').select('display_name').maybeSingle();
    if (error) throw wrap(error); return data;
  };
  C.setDisplayName = async (name) => {
    const { error } = await client.from('profiles').update({ display_name: name }).eq('id', C.user.id);
    if (error) throw wrap(error);
  };

  /* ---------- firma / depolama seçimi ---------- */
  C.activeWs = () => lsGet(LS.activeWs);
  C.setActiveWs = (id) => (id ? lsSet(LS.activeWs, id) : lsDel(LS.activeWs));
  C.storeKey = (ws) => `santiyesefi.ws.${ws}.v1`;
  C.blobDb = (ws) => `santiyesefi-blobs-${ws}`;
  C.syncDb = (ws) => `santiyesefi-sync-${ws}`;

  /** Yerel depoyu verilen firmaya çevirir (veri, dosya deposu); veri yoksa boş başlatır. */
  C.useWorkspace = (ws) => {
    C.ws = ws;
    SS.store.key = C.storeKey(ws);
    SS.blob.useDb(C.blobDb(ws));
    const had = SS.store.load();
    if (!had) SS.store.fresh();
    return had;
  };
  C.hasWorkspaceData = (ws) => lsGet(C.storeKey(ws)) != null;

  /** Bu cihazda "eski yerel veri" (hesaba bağlanmadan önce girilmiş) var mı? */
  C.legacy = () => {
    if (lsGet(LS.adopted)) return null;
    try {
      const raw = lsGet(SS.store.LEGACY_KEY); if (!raw) return null;
      const d = JSON.parse(raw); const n = SS.store.COLLS.reduce((t, k) => t + (Array.isArray(d[k]) ? d[k].length : 0), 0);
      return n ? { data: d, count: n } : null;
    } catch (e) { return null; }
  };
  C.adoptLegacy = async (ws) => {
    const lg = C.legacy(); if (!lg) return 0;
    SS.store.key = C.storeKey(ws); SS.store.data = lg.data; SS.store.ensure();
    const keep = { user: SS.cfg.user, theme: SS.cfg.theme, sound: SS.cfg.sound, sidebar: SS.cfg.sidebar };
    Object.assign(SS.cfg, { onboarded: true, activeProject: 'all' }, keep);
    SS.store.flush();
    await SS.blob.copyFrom(SS.blob.LEGACY_DB);
    lsSet(LS.adopted, ws);                                       // eski veri silinmez (yedek olarak kalır); yalnızca bir kez aktarılır
    return lg.count;
  };

  /* ---------- cihaz kimliği ---------- */
  C.deviceKey = (ws) => {
    const k = `santiyesefi.device.${ws}`; let v = lsGet(k);
    if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, ''); lsSet(k, v); }
    return v;
  };
  C.deviceLabel = () => {
    if (window.AndroidBridge) return 'Android uygulaması';
    const ua = navigator.userAgent || '';
    return /iPhone|iPad/.test(ua) ? 'iPhone / iPad' : /Android/.test(ua) ? 'Android tarayıcı' : /Windows/.test(ua) ? 'Windows tarayıcı' : /Mac/.test(ua) ? 'Mac tarayıcı' : 'Web tarayıcı';
  };

  /* ---------- eşitleme durumunu kalıcı tutan IndexedDB (kv + base) ---------- */
  function idbState(ws) {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res) => {
      try {
        const rq = indexedDB.open(C.syncDb(ws), 1);
        rq.onupgradeneeded = () => { const d = rq.result; d.createObjectStore('kv', { keyPath: 'k' }); d.createObjectStore('base', { keyPath: 'k' }); };
        rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null);
      } catch (e) { res(null); }
    }));
    const mem = { kv: {}, base: new Map() };                       // IndexedDB yoksa (gizli sekme) bellekte tut: eşitleme çalışır ama yeniden başlayınca baştan karşılaştırır
    const tx = (db, stores, mode, fn) => new Promise((res, rej) => { const t = db.transaction(stores, mode); fn(t); t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
    return {
      async load() {
        const db = await open(); if (!db) return { kv: mem.kv, base: [...mem.base] };
        const [kvRows, baseRows] = await Promise.all(['kv', 'base'].map((s) => new Promise((res) => { const rq = db.transaction(s).objectStore(s).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); })));
        const kv = (kvRows.find((r) => r.k === 'kv') || {}).v || {};
        return { kv, base: baseRows.map((r) => [r.k, r.v]) };
      },
      async saveBase(ups, dels) {
        const db = await open();
        if (!db) { if (dels === null) mem.base.clear(); ups.forEach(([k, v]) => mem.base.set(k, v)); (dels || []).forEach((k) => mem.base.delete(k)); return; }
        await tx(db, ['base'], 'readwrite', (t) => { const s = t.objectStore('base'); if (dels === null) s.clear(); ups.forEach(([k, v]) => s.put({ k, v })); (dels || []).forEach((k) => s.delete(k)); });
      },
      async saveKv(kv) {
        const db = await open(); if (!db) { mem.kv = JSON.parse(JSON.stringify(kv)); return; }
        await tx(db, ['kv'], 'readwrite', (t) => t.objectStore('kv').put({ k: 'kv', v: kv }));
      },
    };
  }
  C.clearLocal = async (ws) => {
    lsDel(C.storeKey(ws)); lsDel(`santiyesefi.device.${ws}`); lsDel(`santiyesefi.owner.${ws}`);
    for (const n of [C.blobDb(ws), C.syncDb(ws)]) { try { indexedDB.deleteDatabase(n); } catch (e) { /* */ } }
  };

  /* ---------- senkron motoru için aktarım ---------- */
  C.transport = {
    licenseInfo: (ws) => C.licenseInfo(ws),
    registerDevice: (ws, key, label, platform) => rpc('register_device', { p_ws: ws, p_device_key: key, p_label: label, p_platform: platform }),
    pull: (ws, key, since, limit) => rpc('pull_records', { p_ws: ws, p_device: key, p_since: since, p_limit: limit }),
    push: (ws, key, records) => rpc('push_records', { p_ws: ws, p_device: key, p_records: records }),
    registerBlob: (ws, id, size, type, name) => rpc('register_blob', { p_ws: ws, p_id: id, p_size: size, p_type: type, p_name: name }),
    async uploadBlob(ws, id, blob, type) {
      const { error } = await client.storage.from('blobs').upload(`${ws}/${id}`, blob, { contentType: type, upsert: true });
      if (error) throw wrap(error);
    },
    async downloadBlob(ws, id) {
      const { data, error } = await client.storage.from('blobs').download(`${ws}/${id}`);
      if (error) { const e = wrap(error); if (/not found|404|Object not found/i.test(String(error.message))) return null; throw e; }
      return data;
    },
    async blobInfo(ws, id) {
      const { data, error } = await client.from('blobs').select('name,type,size').eq('workspace_id', ws).eq('id', id).maybeSingle();
      if (error) throw wrap(error); return data;
    },
  };

  const blobAdapter = {
    listIds: () => SS.blob.ids(),
    getRecord: async (id) => { const db = await SS.blob.open(); if (!db) return SS.blob.mem.get(id) || null; return new Promise((res) => { const rq = db.transaction('b').objectStore('b').get(id); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); }); },
    put: (id, value, meta) => SS.blob.put(id, value, meta),
  };
  C.fetchBlob = (id) => (C.engine ? C.engine.fetchBlob(id) : null);

  /* ---------- eşitleme zamanlaması ---------- */
  let timer = null, internal = false, lastRun = 0;
  C.kick = (ms = 2500) => { if (!C.engine) return; clearTimeout(timer); timer = setTimeout(() => { lastRun = Date.now(); C.engine.sync(); }, ms); };
  C.onFlush = () => { if (!internal) C.kick(); };
  C.syncNow = () => { if (!C.engine) return Promise.resolve(C.status); lastRun = Date.now(); return C.engine.sync(); };

  function doRefresh() {
    try { SS.ui.fillProjSel && SS.ui.fillProjSel(); SS.ui.rerender(); } catch (e) { console.error(e); }
  }
  C.refreshUI = () => { if (document.querySelector('.layer')) C._later = true; else doRefresh(); };      // form açıkken kullanıcının ekranı bozulmaz
  setInterval(() => { if (C._later && !document.querySelector('.layer')) { C._later = false; doRefresh(); } }, 1500);

  C.onStatus = (st) => {
    C.status = st;
    const b = document.getElementById('syncBtn');
    if (b) {
      const label = { idle: 'Eşitlendi', syncing: 'Eşitleniyor…', offline: 'Çevrimdışı — değişiklikler cihazda bekliyor', readonly: 'Lisans askıda — salt okunur', revoked: 'Bu cihaz çıkarıldı', removed: 'Firmadan çıkarıldınız', error: 'Eşitleme hatası' }[st.state] || '';
      b.dataset.state = st.state; b.title = `${label}${st.pending ? ` · ${st.pending} bekleyen değişiklik` : ''}`;
      b.querySelector('.sync-n').textContent = st.pending > 0 ? (st.pending > 99 ? '99+' : st.pending) : '';
    }
    const bm = document.querySelector('.bn-more'); if (bm) { bm.dataset.state = st.state; bm.title = b ? b.title : ''; }   // mobil: durum "Menü" düğmesindeki noktada
    if (SS.ui.current && SS.ui.current.name === 'account' && SS.views.account.paintSync) SS.views.account.paintSync();
    if (SS.account && SS.account.onStatus) SS.account.onStatus(st);
  };

  C.startSync = async () => {
    if (C.engine) return C.engine;
    const ws = C.ws;
    const flushLocal = () => { internal = true; try { SS.store.flush(); } finally { internal = false; } };
    C.engine = await new SS.syncCore.Engine({
      ws, deviceKey: C.deviceKey(ws), getData: () => SS.D, flushLocal, transport: C.transport, state: idbState(ws), blobs: blobAdapter,
      deviceLabel: C.deviceLabel(), platform: window.AndroidBridge ? 'android-app' : 'web',
      onChange: C.refreshUI, onStatus: C.onStatus,
    }).init();
    window.addEventListener('online', () => C.kick(500));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - lastRun > 15000) C.kick(800); });
    setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine !== false && !C.engine.running) { lastRun = Date.now(); C.engine.sync(); } }, 45000);
    C.kick(300);
    return C.engine;
  };

  C.signOut = async () => {
    try { await client.auth.signOut(); } catch (e) { /* çevrimdışı olabilir */ }
    C.engine = null; C.user = null;
  };
})();
