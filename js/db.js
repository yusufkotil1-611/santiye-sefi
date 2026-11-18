/* Şantiye Şefi — kalıcı veri katmanı: LocalStorage (kayıtlar) + IndexedDB (görsel / belge / çizim dosyaları) */
(function () {
  const SS = window.SS;
  const KEY = 'santiyesefi.v1';
  const COLLS = ['projects', 'tasks', 'firms', 'expenses', 'contracts', 'hakedis', 'customers', 'units', 'workers', 'advances', 'payrolls', 'materials', 'movements', 'drawings', 'diary', 'safety', 'punch', 'machines', 'machineLogs', 'reports', 'concrete', 'orders', 'todos', 'meetings'];

  const S = (SS.store = {
    data: null,
    COLLS,
    key: KEY,   // bulut kipinde firma başına ayrı anahtar kullanılır (SS.cloud.useWorkspace)
    LEGACY_KEY: KEY,
    load() {
      try {
        const raw = localStorage.getItem(this.key);
        if (raw) { this.data = JSON.parse(raw); this.ensure(); return true; }
      } catch (e) { console.warn('Veri okunamadı', e); }
      return false;
    },
    ensure() {
      const d = this.data;
      COLLS.forEach((c) => { if (!Array.isArray(d[c])) d[c] = []; });
      d.attendance = d.attendance || {};
      d.settings = Object.assign({ company: '', user: '', onboarded: false, sound: true, theme: 'auto', activeProject: 'all', fuelPrice: 44.5, overtime: 1.5, sidebar: false, city: '', lastBackup: '', wxOn: false }, d.settings);
    },
    fresh() { this.data = { settings: {}, attendance: {} }; this.ensure(); },
    /* Önceki sürümlerin otomatik yüklediği örnek (demo) veri var mı? */
    DEMO_PROJECTS: ['p_vadi', 'p_depo', 'p_sosyal', 'p_villa'],
    hasDemo() { return !!this.data && this.data.projects.some((p) => this.DEMO_PROJECTS.includes(p.id)); },
    /* Yalnızca örnek şantiyelere bağlı kayıtları ve yalnızca onlara ait firmaları kaldırır; kullanıcının kendi kayıtlarına dokunmaz */
    removeDemo() {
      const d = this.data, ids = new Set(this.DEMO_PROJECTS);
      const demoWorkers = new Set(d.workers.filter((w) => ids.has(w.projectId)).map((w) => w.id));
      const demoMats = new Set(d.materials.filter((m) => ids.has(m.projectId)).map((m) => m.id));
      const demoMachines = new Set(d.machines.filter((m) => ids.has(m.projectId)).map((m) => m.id));
      const demoCust = new Set(d.units.filter((u) => ids.has(u.projectId) && u.customerId).map((u) => u.customerId));
      const demoNames = new Set(d.projects.filter((p) => ids.has(p.id)).map((p) => p.shortName));
      COLLS.forEach((c) => { if (c === 'firms' || c === 'customers') return; d[c] = d[c].filter((x) => !ids.has(x.projectId) && !ids.has(x.id)); });
      d.movements = d.movements.filter((m) => !demoMats.has(m.materialId)); d.machineLogs = d.machineLogs.filter((l) => !demoMachines.has(l.machineId));
      d.reports = d.reports.filter((r) => !demoNames.has(r.project));
      const keepCust = new Set(d.units.map((u) => u.customerId)); d.customers = d.customers.filter((c) => !demoCust.has(c.id) || keepCust.has(c.id));
      d.advances = d.advances.filter((a) => !demoWorkers.has(a.workerId)); d.payrolls = d.payrolls.filter((p) => !demoWorkers.has(p.workerId));
      Object.keys(d.attendance).forEach((k) => { demoWorkers.forEach((w) => delete d.attendance[k][w]); if (!Object.keys(d.attendance[k]).length) delete d.attendance[k]; });
      const used = new Set([...d.expenses, ...d.contracts].map((x) => x.firmId));
      d.firms = d.firms.filter((f) => !/^f_/.test(f.id) || used.has(f.id));
      if (ids.has(d.settings.activeProject)) d.settings.activeProject = 'all';
      this.flush();
    },
    _t: null,
    save() {
      clearTimeout(this._t);
      this._t = setTimeout(() => { this._t = null; this.flush(); }, 120);   // _t sıfırlanır: aksi halde sayfa kapanırken gereksiz yeniden yazma olur
    },
    frozen: false,   // çıkış yapılırken true: hiçbir yazma yerel depoyu yeniden oluşturamaz
    flush() {
      if (this.frozen) return;
      try { localStorage.setItem(this.key, JSON.stringify(this.data)); }
      catch (e) { console.error(e); SS.ui && SS.ui.toast && SS.ui.toast('Tarayıcı depolama alanı doldu — yedek alıp eski kayıtları temizleyin.', 'bad'); return; }
      if (SS.cloud && SS.cloud.onFlush) SS.cloud.onFlush();   // bulut eşitlemesini zamanla (yalnızca bulut kipinde var)
    },
    list(c) { return this.data[c]; },
    find(c, id) { return this.data[c].find((x) => x.id === id); },
    add(c, obj, prefix) { if (!obj.id) obj.id = SS.U.id(prefix || c[0]); this.data[c].push(obj); this.save(); return obj; },
    upd(c, id, patch) { const o = this.find(c, id); if (o) { Object.assign(o, patch); this.save(); } return o; },
    del(c, id) { const i = this.data[c].findIndex((x) => x.id === id); if (i >= 0) { const [o] = this.data[c].splice(i, 1); this.save(); return o; } },
    wipe() { localStorage.removeItem(this.key); },
  });
  /* Sekme kapanırken / arka plana geçerken bekleyen kaydı hemen yaz (debounce nedeniyle veri kaybını önler) */
  const flushNow = () => { if (S.data && S._t) { clearTimeout(S._t); S._t = null; S.flush(); } };
  window.addEventListener('pagehide', flushNow); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  Object.defineProperty(SS, 'D', { get: () => S.data });
  Object.defineProperty(SS, 'cfg', { get: () => S.data.settings });

  /* ---------- IndexedDB blob deposu ---------- */
  const B = (SS.blob = {
    _db: null, mem: new Map(), urls: new Map(), miss: new Map(),
    dbName: 'santiyesefi-blobs',   // bulut kipinde firma başına ayrı veritabanı (firmalar arası dosya karışmasın)
    LEGACY_DB: 'santiyesefi-blobs',
    /* Başka bir firmaya geçerken: açık bağlantıyı bırak ve yeni veritabanı adını kullan */
    useDb(name) {
      this.dbName = name; this._p = null; this._db = null; this.mem.clear(); this.miss.clear();
      this.urls.forEach((u) => URL.revokeObjectURL(u)); this.urls.clear();
    },
    open() {
      if (this._p) return this._p;
      this._p = new Promise((res) => {
        try {
          const rq = indexedDB.open(this.dbName, 1);
          rq.onupgradeneeded = () => rq.result.createObjectStore('b', { keyPath: 'id' });
          rq.onsuccess = () => { this._db = rq.result; res(this._db); };
          rq.onerror = () => res(null);
        } catch (e) { res(null); }
      });
      return this._p;
    },
    async put(id, value, meta = {}) {
      const rec = Object.assign({ id, value }, meta);
      this.mem.set(id, rec);
      const old = this.urls.get(id); if (old) { URL.revokeObjectURL(old); this.urls.delete(id); }
      const db = await this.open(); if (!db) return id;
      return new Promise((res) => { const tx = db.transaction('b', 'readwrite'); tx.objectStore('b').put(rec); tx.oncomplete = () => res(id); tx.onerror = () => res(id); });
    },
    async get(id) {
      if (this.mem.has(id)) return this.mem.get(id);
      const db = await this.open(); if (!db) return null;
      const local = await new Promise((res) => { const rq = db.transaction('b').objectStore('b').get(id); rq.onsuccess = () => { if (rq.result) this.mem.set(id, rq.result); res(rq.result || null); }; rq.onerror = () => res(null); });
      if (local || !SS.cloud || !SS.cloud.fetchBlob) return local;
      /* Bu cihazda yok: başka cihazın yüklediği dosya olabilir → buluttan indir (başarısızsa 30 sn tekrar denenmez) */
      const t = this.miss.get(id); if (t && Date.now() - t < 30000) return null;
      try { const r = await SS.cloud.fetchBlob(id); if (r) { this.mem.set(id, r); return r; } } catch (e) { /* çevrimdışı olabilir */ }
      this.miss.set(id, Date.now()); return null;
    },
    /* Yalnızca kimlikler (tüm dosyaları belleğe yüklemeden) */
    async ids() {
      const db = await this.open(); if (!db) return [...this.mem.keys()];
      return new Promise((res) => { const rq = db.transaction('b').objectStore('b').getAllKeys(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); });
    },
    /* Başka bir blob veritabanındaki tüm dosyaları bu veritabanına kopyalar (eski yerel veriyi firmaya aktarırken) */
    async copyFrom(name) {
      const src = await new Promise((res) => { try { const rq = indexedDB.open(name, 1); rq.onupgradeneeded = () => rq.result.createObjectStore('b', { keyPath: 'id' }); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); } catch (e) { res(null); } });
      if (!src) return 0;
      const all = await new Promise((res) => { const rq = src.transaction('b').objectStore('b').getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); });
      src.close();
      for (const r of all) await this.put(r.id, r.value, { name: r.name, type: r.type });
      return all.length;
    },
    async del(id) {
      this.mem.delete(id);
      const db = await this.open(); if (!db) return;
      return new Promise((res) => { const tx = db.transaction('b', 'readwrite'); tx.objectStore('b').delete(id); tx.oncomplete = () => res(); tx.onerror = () => res(); });
    },
    async all() {
      const db = await this.open(); if (!db) return [...this.mem.values()];
      return new Promise((res) => { const rq = db.transaction('b').objectStore('b').getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); });
    },
    async clear() {
      this.mem.clear(); this.urls.forEach((u) => URL.revokeObjectURL(u)); this.urls.clear();
      const db = await this.open(); if (!db) return;
      return new Promise((res) => { const tx = db.transaction('b', 'readwrite'); tx.objectStore('b').clear(); tx.oncomplete = () => res(); tx.onerror = () => res(); });
    },
    async url(id) {
      if (this.urls.has(id)) return this.urls.get(id);
      const r = await this.get(id); if (!r || !(r.value instanceof Blob)) return null;
      const u = URL.createObjectURL(r.value); this.urls.set(id, u); return u;
    },
    /* Görseli küçültüp JPEG olarak saklar */
    async putImage(file, max = 1400, q = 0.74) {
      const id = SS.U.id('img');
      if (file.type === 'image/svg+xml') { await this.put(id, file, { name: file.name, type: file.type }); return { id, name: file.name, type: file.type, size: file.size }; }
      const bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(bmp.src);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', q));
      await this.put(id, blob, { name: file.name, type: 'image/jpeg' });
      return { id, name: file.name, type: 'image/jpeg', size: blob.size };
    },
    async putFile(file) {
      if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') return this.putImage(file);
      const id = SS.U.id('doc'); await this.put(id, file, { name: file.name, type: file.type });
      return { id, name: file.name, type: file.type || 'application/octet-stream', size: file.size };
    },
    /* Yedek için base64 dökümü */
    async dump() {
      const all = await this.all(); const out = [];
      for (const r of all) {
        if (r.value instanceof Blob) {
          const b64 = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(r.value); });
          out.push({ id: r.id, name: r.name, type: r.type, data: b64 });
        } else out.push({ id: r.id, name: r.name, type: r.type, json: r.value });
      }
      return out;
    },
    async restore(list) {
      await this.clear();
      for (const r of list || []) {
        if (r.data) { const blob = await (await fetch(r.data)).blob(); await this.put(r.id, blob, { name: r.name, type: r.type }); }
        else await this.put(r.id, r.json, { name: r.name, type: r.type });
      }
    },
  });
})();
