/* Şantiye Şefi — bulut senkron çekirdeği (DOM'dan bağımsız; Node'da test edilir)

   Model: yerel veri (SS.D) olduğu gibi kalır; görünümler değişmez. Senkron, yerel veriyi KAYITLARA böler
   (koleksiyon/id → veri), her kaydın en son eşitlenen halini ("base") saklar ve farkı sunucuya gönderir.

   Çakışma: sunucu iyimser eşzamanlılık kullanır (base_rev). Çakışmada istemci 3 yönlü birleştirme yapar:
     base (son eşitlenen) · local (şu anki) · remote (sunucudaki) → alan bazında; aynı alan iki yerde farklı
     değiştiyse gönderen (yerel) kazanır ve bir bildirim kaydedilir. Kimlikli dizilerde (foto/belge listeleri) öğe bazında birleştirir.
     Silme her zaman kazanır.

   Çökme güvenliği sırası:  uzaktan gelen veriyi uygula → yerel depoya yaz (flushLocal) → ANCAK SONRA base/since kaydet.
   Arada çökerse yerel veri yeni, base eski kalır: bir sonraki eşitleme bunu "yerel değişiklik" sanır ama 3 yönlü birleştirme
   uzak sürümle aynı sonucu verir; uzaktaki veri bayat veriyle ezilmez. */
(function (root) {
  'use strict';
  const SS = (root.SS = root.SS || {});

  /* db.js içindeki SS.store.COLLS ile AYNI olmalı (test denetler) */
  const COLLS = ['projects', 'tasks', 'firms', 'expenses', 'contracts', 'hakedis', 'customers', 'units', 'workers', 'advances', 'payrolls', 'materials', 'movements', 'drawings', 'diary', 'safety', 'punch', 'machines', 'machineLogs', 'reports', 'concrete', 'orders', 'todos', 'meetings'];
  const FINANCE = new Set(['expenses', 'contracts', 'hakedis', 'firms', 'customers', 'units', 'advances', 'payrolls', 'orders']);
  /* Firmaya ait (paylaşılan) ayarlar; geri kalanı (tema, hitap adı, etkin şantiye…) cihazda kalır */
  const SHARED_DEFAULTS = { company: '', fuelPrice: 44.5, overtime: 1.5, city: '' };

  /* ---------- yardımcılar ---------- */
  function canon(v) {
    if (v === undefined) return 'u';
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    const ks = Object.keys(v).filter((k) => v[k] !== undefined).sort();
    return '{' + ks.map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }
  const eq = (a, b) => canon(a) === canon(b);
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  const key = (coll, id) => coll + '/' + id;
  const splitKey = (k) => { const i = k.indexOf('/'); return [k.slice(0, i), k.slice(i + 1)]; };
  const attId = (date, w) => date + '_' + w;
  const splitAtt = (id) => [id.slice(0, 10), id.slice(11)];

  /* Rol × koleksiyon yazma matrisi (SQL private.can_write_record ile aynı; test karşılaştırır) */
  function groupOf(coll) { return coll === 'settings' ? 'admin' : FINANCE.has(coll) ? 'finance' : 'field'; }
  function canWrite(role, coll) {
    const g = groupOf(coll);
    switch (role) {
      case 'owner': case 'admin': return true;
      case 'chief': return g === 'finance' || g === 'field';
      case 'accountant': return g === 'finance';
      default: return false;
    }
  }

  /* ---------- yerel veri ↔ kayıtlar ---------- */
  function sharedSettings(settings) {
    const o = {};
    for (const k of Object.keys(SHARED_DEFAULTS)) {
      if (settings && settings[k] !== undefined && !eq(settings[k], SHARED_DEFAULTS[k])) o[k] = settings[k];
    }
    return Object.keys(o).length ? o : null;
  }

  /** Kimliksiz öğelere kimlik verir (yeni eklenen eski kodlar için güvence). */
  function normalize(data, genId) {
    const gen = genId || ((p) => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3));
    let n = 0;
    for (const c of COLLS) {
      if (!Array.isArray(data[c])) data[c] = [];
      for (const el of data[c]) if (el && typeof el === 'object' && !el.id) { el.id = gen(c[0]); n++; }
    }
    if (!data.attendance || typeof data.attendance !== 'object') data.attendance = {};
    return n;
  }

  /** Yerel veriyi Map<anahtar, {coll,id,data,json}> olarak döndürür. */
  function toRecords(data) {
    const out = new Map();
    for (const c of COLLS) {
      for (const el of data[c] || []) {
        if (!el || typeof el !== 'object' || !el.id) continue;
        out.set(key(c, el.id), { coll: c, id: el.id, data: el, json: canon(el) });
      }
    }
    const att = data.attendance || {};
    for (const date of Object.keys(att)) {
      const day = att[date] || {};
      for (const w of Object.keys(day)) {
        const d = { date, workerId: w, code: day[w] };
        out.set(key('attendance', attId(date, w)), { coll: 'attendance', id: attId(date, w), data: d, json: canon(d) });
      }
    }
    const s = sharedSettings(data.settings);
    if (s) out.set(key('settings', 'workspace'), { coll: 'settings', id: 'workspace', data: s, json: canon(s) });
    return out;
  }

  /** Yerel veri üzerinde kayıt okuma/yazma/silme (dizileri yerinde günceller; görünümlerin referansları bozulmaz). */
  class LocalIndex {
    constructor(data) {
      this.d = data;
      this.m = {};
      for (const c of COLLS) {
        const mp = (this.m[c] = new Map());
        for (const el of data[c] || []) if (el && el.id) mp.set(el.id, el);
      }
    }
    get(coll, id) {
      if (coll === 'attendance') {
        const [date, w] = splitAtt(id), day = this.d.attendance && this.d.attendance[date];
        return day && day[w] !== undefined ? { date, workerId: w, code: day[w] } : undefined;
      }
      if (coll === 'settings') return sharedSettings(this.d.settings) || undefined;
      return this.m[coll] && this.m[coll].get(id);
    }
    put(coll, id, rec) {
      if (coll === 'attendance') {
        const [date, w] = splitAtt(id);
        this.d.attendance = this.d.attendance || {};
        (this.d.attendance[date] = this.d.attendance[date] || {})[w] = rec.code;
        return;
      }
      if (coll === 'settings') {
        this.d.settings = this.d.settings || {};
        for (const k of Object.keys(SHARED_DEFAULTS)) this.d.settings[k] = rec && rec[k] !== undefined ? clone(rec[k]) : SHARED_DEFAULTS[k];
        return;
      }
      const el = this.m[coll].get(id), n = clone(rec);
      if (!n.id) n.id = id;
      if (el) { for (const k of Object.keys(el)) delete el[k]; Object.assign(el, n); }
      else { this.d[coll].push(n); this.m[coll].set(id, n); }
    }
    remove(coll, id) {
      if (coll === 'attendance') {
        const [date, w] = splitAtt(id), day = this.d.attendance && this.d.attendance[date];
        if (day) { delete day[w]; if (!Object.keys(day).length) delete this.d.attendance[date]; }
        return;
      }
      if (coll === 'settings') { this.put('settings', 'workspace', null); return; }
      const el = this.m[coll].get(id);
      if (!el) return;
      const i = this.d[coll].indexOf(el);
      if (i >= 0) this.d[coll].splice(i, 1);
      this.m[coll].delete(id);
    }
    /** Cihazdaki tüm kayıtları (firma ayarları dahil) boşaltır — "buluttakini kullan" kipi için. */
    clearAll() {
      for (const c of COLLS) { this.d[c].length = 0; this.m[c].clear(); }
      this.d.attendance = {};
      this.put('settings', 'workspace', null);
    }
  }

  /* ---------- 3 yönlü birleştirme ---------- */
  function mergeValue(b, l, r, path, conflicts) {
    if (eq(l, r)) return l;
    if (eq(l, b)) return r;
    if (eq(r, b)) return l;
    if (isObj(l) && isObj(r) && (b === undefined || isObj(b))) return mergeObject(b || {}, l, r, path, conflicts);
    if (isIdArray(l) && isIdArray(r) && (b === undefined || isIdArray(b))) return mergeIdArray(b || [], l, r, path, conflicts);
    conflicts.push(path || '(kayıt)');
    return l;
  }
  function mergeObject(b, l, r, path, conflicts) {
    const out = {};
    const ks = new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)]);
    for (const k of ks) {
      const v = mergeValue(b[k], l[k], r[k], path ? path + '.' + k : k, conflicts);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  const isIdArray = (a) => Array.isArray(a) && a.every((x) => isObj(x) && typeof x.id === 'string');
  function mergeIdArray(b, l, r, path, conflicts) {
    const bm = new Map(b.map((x) => [x.id, x])), lm = new Map(l.map((x) => [x.id, x])), rm = new Map(r.map((x) => [x.id, x]));
    const out = [];
    for (const re of r) {
      const le = lm.get(re.id), be = bm.get(re.id);
      if (le) out.push(mergeValue(be, le, re, `${path}[${re.id}]`, conflicts));
      else if (be) { if (!eq(re, be)) { conflicts.push(`${path}[${re.id}]`); out.push(re); } }   // yerelde silindi, uzakta düzenlendi → düzenleme korunur
      else out.push(re);                                                                          // uzakta eklendi
    }
    for (const le of l) {
      if (rm.has(le.id)) continue;
      const be = bm.get(le.id);
      if (be) { if (!eq(le, be)) { conflicts.push(`${path}[${le.id}]`); out.push(le); } }         // uzakta silindi, yerelde düzenlendi → düzenleme korunur
      else out.push(le);                                                                          // yerelde eklendi
    }
    return out;
  }
  /** @returns {{data:Object, conflicts:string[]}} */
  function merge3(base, local, remote) {
    const conflicts = [];
    const data = mergeObject(base || {}, local, remote, '', conflicts);
    return { data, conflicts };
  }

  /* ---------- eşitleme motoru ---------- */
  const NET_RE = /failed to fetch|networkerror|network request failed|load failed|timeout|offline|ECONNRE|ENOTFOUND|fetch failed/i;
  const isOffline = (e) => !!(e && (e.offline || NET_RE.test(String(e.message || e))));
  const errCode = (e) => { const m = String((e && e.message) || e || ''); const hit = m.match(/device_unknown|device_revoked|not_member|not_authenticated|storage_quota|license_readonly|invalid_batch/); return hit ? hit[0] : null; };

  class Engine {
    /**
     * @param o.ws          firma kimliği
     * @param o.deviceKey   bu cihazın kalıcı rastgele kimliği (8–128 karakter)
     * @param o.getData     () => canlı yerel veri nesnesi (SS.D)
     * @param o.flushLocal  () => yerel depoya (localStorage) SENKRON yazar
     * @param o.transport   { licenseInfo, registerDevice, pull, push, registerBlob, uploadBlob, downloadBlob, blobInfo }
     * @param o.state       { load():{kv,base}, saveBase(upserts[[k,v]], deletes[k]), saveKv(kv) }
     * @param o.blobs       { listIds(), getRecord(id), put(id,value,meta) }  (isteğe bağlı)
     * @param o.onChange    uzaktan veri uygulanınca çağrılır (arayüzü yenilemek için)
     * @param o.onStatus    durum değişince çağrılır
     * @param o.deviceLabel/platform  cihaz kaydı için
     */
    constructor(o) {
      Object.assign(this, { onChange() {}, onStatus() {}, flushLocal() {}, deviceLabel: null, platform: null }, o);
      this.base = new Map();
      this.kv = { since: 0, rejected: {}, blobsUp: [], lastSyncAt: 0, deviceOkAt: 0 };
      this.running = false; this.again = false;
      this.notices = [];
      this.info = null;
      this.status = { state: 'idle', pending: 0, notices: [], lastSyncAt: 0, message: '', role: null, writable: true };
    }

    async init() {
      const s = await this.state.load();
      this.base = new Map(Array.isArray(s.base) ? s.base : Object.entries(s.base || {}));
      Object.assign(this.kv, s.kv || {});
      this.kv.rejected = this.kv.rejected || {};
      this.kv.blobsUp = this.kv.blobsUp || [];
      return this;
    }

    clearNotices() { this.notices = []; this._set(this.status.state); }

    _set(state, extra) {
      this.status = Object.assign({}, this.status, { state, notices: this.notices.slice(-40), lastSyncAt: this.kv.lastSyncAt, role: this.info && this.info.role, writable: this.info ? !!this.info.license.writable : true }, extra || {});
      try { this.onStatus(this.status); } catch (e) { /* arayüz hatası eşitlemeyi bozmasın */ }
    }
    _notice(kind, k, extra) {
      this.notices.push(Object.assign({ kind, key: k, at: Date.now() }, extra || {}));
      if (this.notices.length > 100) this.notices.splice(0, this.notices.length - 100);
    }

    /** Bu cihazdaki bekleyen (gönderilmemiş) değişiklikler */
    diff() {
      const data = this.getData();
      const local = toRecords(data), out = [];
      for (const [k, r] of local) {
        const b = this.base.get(k);
        if (b && !b.del && b.json === r.json) continue;
        if (this.kv.rejected[k] === r.json) continue;
        out.push({ key: k, coll: r.coll, id: r.id, data: r.data, json: r.json, deleted: false, base_rev: b ? b.rev : 0 });
      }
      for (const [k, b] of this.base) {
        if (b.del || local.has(k)) continue;
        const [coll, id] = splitKey(k);
        out.push({ key: k, coll, id, data: {}, json: null, deleted: true, base_rev: b.rev });
      }
      return out;
    }
    pendingCount() { return this.diff().length; }

    /* --- uzaktan gelen bir kaydı yerel veriye uygula (idx: o anki yerel dizin) --- */
    _applyRemote(idx, coll, id, rev, deleted, rdata, ups) {
      const k = key(coll, id), b = this.base.get(k);
      rev = Number(rev);
      if (b && rev <= b.rev) return false;                              // eko / eski
      const cur = idx.get(coll, id);
      const baseLive = !!b && !b.del;
      const curJson = cur === undefined ? null : canon(cur);
      const dirty = baseLive ? curJson !== b.json : cur !== undefined;   // base'siz yerel kayıt da "yeni değişiklik"tir
      const localDeletePending = baseLive && cur === undefined;
      let changed = false;

      if (deleted) {
        if (cur !== undefined) {
          if (dirty) this._notice('deleted_remote', k);                  // yerel düzenleme, uzaktaki silmeyle ezildi
          idx.remove(coll, id); changed = true;
        }
        const nb = { del: true, rev }; this.base.set(k, nb); ups.push([k, nb]);
      } else if (localDeletePending) {
        const nb = { json: canon(rdata), rev };                          // yerel silme beklemede: silme kazanır, base'i güncelle ki silme gönderilebilsin
        this.base.set(k, nb); ups.push([k, nb]);
      } else if (cur === undefined || !dirty) {
        idx.put(coll, id, rdata); changed = true;
        const nb = { json: canon(rdata), rev }; this.base.set(k, nb); ups.push([k, nb]);
      } else {
        const m = merge3(baseLive ? JSON.parse(b.json) : {}, cur, rdata);
        if (m.conflicts.length) this._notice('fields', k, { fields: m.conflicts });
        idx.put(coll, id, m.data); changed = true;
        const nb = { json: canon(rdata), rev };                          // birleşmiş sürüm uzaktakinden farklıysa yeniden "değişmiş" görünür ve gönderilir
        this.base.set(k, nb); ups.push([k, nb]);
      }
      return changed;
    }

    async _persist(ups, dels) {
      await this.state.saveBase(ups, dels || []);
      await this.state.saveKv(this.kv);
    }

    async _pull() {
      for (let guard = 0; guard < 2000; guard++) {
        const p = await this.transport.pull(this.ws, this.deviceKey, this.kv.since, 500);
        const idx = new LocalIndex(this.getData());                      // await'ten sonra taze dizin: kullanıcı bu arada düzenlemiş olabilir
        const ups = []; let changed = false;
        for (const r of p.records) if (this._applyRemote(idx, r.coll, r.id, r.rev, r.deleted, r.data, ups)) changed = true;
        if (p.records.length) this.flushLocal();                         // 1) yerel veri  2) sonra base/since
        if (changed) { this.changedFlag = true; }
        this.kv.since = Math.max(this.kv.since, Number(p.max_seq));
        await this._persist(ups);
        if (!p.has_more) return;
      }
    }

    /** Rolü yetmeyen koleksiyonlardaki yerel değişiklikleri geri al (ör. izleyici/muhasebe). */
    _revertUnwritable() {
      const role = this.info.role, idx = new LocalIndex(this.getData()), ups = [];
      let n = 0;
      for (const c of this.diff()) {
        if (canWrite(role, c.coll)) continue;
        const b = this.base.get(c.key);
        if (b && !b.del) idx.put(c.coll, c.id, JSON.parse(b.json)); else idx.remove(c.coll, c.id);
        n++;
      }
      if (n) { this._notice('reverted_role', null, { count: n, role }); this.flushLocal(); this.changedFlag = true; }
      return n;
    }

    async _push() {
      let did = false;
      for (let round = 0; round < 8; round++) {
        const changes = this.diff().filter((c) => canWrite(this.info.role, c.coll));
        if (!changes.length) return did;
        let settled = 0, conflicts = 0;
        for (let i = 0; i < changes.length; i += 100) {
          const batch = changes.slice(i, i + 100);
          const res = await this.transport.push(this.ws, this.deviceKey, batch.map((c) => ({ coll: c.coll, id: c.id, data: c.data, deleted: c.deleted, base_rev: c.base_rev })));
          const ups = []; const idx = new LocalIndex(this.getData());
          res.results.forEach((r, j) => {
            const c = batch[j];
            if (!c || r.coll !== c.coll || r.id !== c.id) return;       // sıra/kimlik tutmazsa güvenli tarafta kal
            if (r.status === 'ok') {
              const nb = c.deleted ? { del: true, rev: Number(r.rev) } : { json: c.json, rev: Number(r.rev) };
              this.base.set(c.key, nb); ups.push([c.key, nb]); settled++; did = true;
              delete this.kv.rejected[c.key];
            } else if (r.status === 'conflict') {
              this._applyRemote(idx, c.coll, c.id, r.server.rev, r.server.deleted, r.server.data, ups);
              conflicts++; this.changedFlag = true;
            } else {
              this._onError(idx, c, r, ups);
            }
          });
          this.flushLocal();
          await this._persist(ups);
        }
        if (!settled && !conflicts) return did;                          // ilerleme yok (hepsi reddedildi): döngüyü bitir
      }
      return did;
    }

    _onError(idx, c, r, ups) {
      const code = r.code || 'error';
      if (code === 'forbidden' || code === 'license_readonly') {
        // sunucu bu kaydı yazdırmıyor: sunucudaki sürüme dön (yoksa yerel yeni kaydı kaldır)
        if (r.server) this._applyRemote(idx, c.coll, c.id, r.server.rev, r.server.deleted, r.server.data, ups);
        else idx.remove(c.coll, c.id);
        this._notice('reverted_server', c.key, { code });
        this.changedFlag = true;
      } else {
        // geçici olmayan hata (ör. project_limit): yerel kayıt kalır, kullanıcı değiştirene kadar tekrar denenmez
        if (c.json) this.kv.rejected[c.key] = c.json;
        this._notice('rejected', c.key, { code });
      }
    }

    /* --- blob (foto/belge) yükleme --- */
    async _syncBlobs() {
      if (!this.blobs || !this.transport.registerBlob) return;
      const up = new Set(this.kv.blobsUp);
      const ids = (await this.blobs.listIds()).filter((id) => !up.has(id));
      let n = 0;
      for (const id of ids) {
        if (n++ >= 25) break;                                            // her eşitlemede en çok 25 dosya
        const rec = await this.blobs.getRecord(id);
        if (!rec) continue;
        const isJson = !(rec.value instanceof Blob);
        const blob = isJson ? new Blob([JSON.stringify(rec.value)], { type: 'application/json' }) : rec.value;
        const type = isJson ? 'application/json' : rec.type || blob.type || 'application/octet-stream';
        try {
          await this.transport.registerBlob(this.ws, id, blob.size, type, rec.name || id);
          await this.transport.uploadBlob(this.ws, id, blob, type);
          up.add(id); this.kv.blobsUp = Array.from(up);
          await this.state.saveKv(this.kv);
        } catch (e) {
          if (errCode(e) === 'storage_quota') { this._notice('storage_quota', null); break; }
          if (isOffline(e)) throw e;
          this._notice('blob_failed', id, { message: String(e.message || e) });
        }
      }
    }

    /** Yerelde olmayan bir blob'u buluttan indirir (SS.blob.get kaçırınca çağrılır). */
    async fetchBlob(id) {
      if (!this.blobs || !this.transport.downloadBlob) return null;
      const info = (await this.transport.blobInfo(this.ws, id)) || {};
      const blob = await this.transport.downloadBlob(this.ws, id);
      if (!blob) return null;
      const isJson = info.type === 'application/json';
      const value = isJson ? JSON.parse(await blob.text()) : blob;
      await this.blobs.put(id, value, { name: info.name || id, type: info.type || blob.type });
      const up = new Set(this.kv.blobsUp); up.add(id); this.kv.blobsUp = Array.from(up);
      await this.state.saveKv(this.kv);
      return await this.blobs.getRecord(id);
    }

    async _ensureDevice(force) {
      const stale = Date.now() - (this.kv.deviceOkAt || 0) > 6 * 3600 * 1000;
      if (!force && !stale) return;
      await this.transport.registerDevice(this.ws, this.deviceKey, this.deviceLabel, this.platform);
      this.kv.deviceOkAt = Date.now();
      await this.state.saveKv(this.kv);
    }

    /** "Bulutta olanı kullan": cihazdaki kayıtları siler (ilk bağlanışta kullanıcı seçerse). Base sıfırlanır. */
    async resetToRemote() {
      new LocalIndex(this.getData()).clearAll();
      this.base = new Map(); this.kv.since = 0; this.kv.rejected = {};
      this.flushLocal();
      await this.state.saveBase([], null);                               // null = hepsini sil
      await this.state.saveKv(this.kv);
      this.changedFlag = true;
    }

    /** İptal edilmiş cihazı bilerek yeniden etkinleştirir (başka bir cihazın oturumu düşer). */
    async reactivate() { await this._ensureDevice(true); return this.sync(); }

    async sync() {
      if (this.running) { this.again = true; return this.status; }
      this.running = true; this.changedFlag = false;
      this._set('syncing');
      let retried = false;
      try {
        for (;;) {
          try {
            this.info = await this.transport.licenseInfo(this.ws);
            await this._ensureDevice(false);
            normalize(this.getData());
            await this._pull();
            if (this.info.license.writable) {
              this._revertUnwritable();
              const pushed = await this._push();
              if (pushed) await this._pull();
              await this._syncBlobs();
            }
            break;
          } catch (e) {
            if (errCode(e) === 'device_unknown' && !retried) { retried = true; await this._ensureDevice(true); continue; }
            throw e;
          }
        }
        this.kv.lastSyncAt = Date.now();
        await this.state.saveKv(this.kv);
        const pending = this.pendingCount();
        this._set(this.info.license.writable ? 'idle' : 'readonly', { pending, message: '' });
        if (this.changedFlag) { try { this.onChange(); } catch (e) { /* ignore */ } }
      } catch (e) {
        const code = errCode(e);
        if (isOffline(e)) this._set('offline', { pending: this._safePending(), message: 'Bağlantı yok — değişiklikler cihazda bekliyor' });
        else if (code === 'device_revoked') this._set('revoked', { pending: this._safePending(), message: 'Bu cihaz, başka bir cihaz eklendiği için çıkarıldı' });
        else if (code === 'not_member') this._set('removed', { message: 'Bu firmanın üyesi değilsiniz' });
        else this._set('error', { pending: this._safePending(), message: String((e && e.message) || e) });
        if (this.changedFlag) { try { this.onChange(); } catch (e2) { /* ignore */ } }
      } finally {
        this.running = false;
        if (this.again) { this.again = false; setTimeout(() => this.sync(), 0); }
      }
      return this.status;
    }
    _safePending() { try { return this.pendingCount(); } catch (e) { return 0; } }
  }

  SS.syncCore = { COLLS, SHARED_DEFAULTS, canon, eq, merge3, toRecords, normalize, canWrite, groupOf, LocalIndex, Engine, isOffline };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.syncCore;
})(typeof window !== 'undefined' ? window : globalThis);
