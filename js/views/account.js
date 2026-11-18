/* Şantiye Şefi — hesap: giriş / kayıt / şifre sıfırlama, firma seçimi, ilk bağlanış sihirbazı ve "Hesap & Lisans" ekranı
   (yalnızca js/config.js doldurulmuşsa çalışır; aksi halde uygulama yerel kipte kalır) */
(function () {
  const SS = window.SS, U = SS.U, ui = SS.ui, I = ui.icon, esc = U.esc;
  const A = (SS.account = {});
  const V = (SS.views.account = { title: 'Hesap & Lisans' });
  const C = () => SS.cloud;
  const $ = (s, r = document) => r.querySelector(s);
  const cfg = window.SS_CONFIG || {};

  const ROLE = { owner: 'Sahip', admin: 'Yönetici', chief: 'Şantiye Şefi', accountant: 'Muhasebe', viewer: 'İzleyici' };
  const ROLE_HINT = { admin: 'Her şeyi yönetir, ekip ekler', chief: 'Finans + saha kayıtları', accountant: 'Yalnızca finans kayıtları', viewer: 'Yalnızca görüntüler (terminal sayılmaz)' };
  const COLL = { projects: 'Şantiye', tasks: 'Görev', firms: 'Firma', expenses: 'Harcama', contracts: 'Sözleşme', hakedis: 'Hakediş', customers: 'Müşteri', units: 'Daire', workers: 'Personel', advances: 'Avans', payrolls: 'Bordro', materials: 'Malzeme', movements: 'Stok hareketi', drawings: 'Çizim', diary: 'Defter kaydı', safety: 'İSG kaydı', punch: 'Eksik/kusur', machines: 'Makine', machineLogs: 'Makine kaydı', reports: 'Rapor', concrete: 'Beton kaydı', orders: 'Satın alma', todos: 'Görev', meetings: 'Toplantı', attendance: 'Puantaj', settings: 'Firma ayarları' };

  SS.css(`
  .wl-err{padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--bad) 12%,var(--surface));color:var(--bad);font-size:13.5px;font-weight:600}
  .wl-info{padding:11px 13px;border-radius:12px;background:color-mix(in srgb,var(--info) 11%,var(--surface));color:var(--ink-2);font-size:13.5px;line-height:1.45}
  .wl-fine{font-size:12px;color:var(--muted);line-height:1.45}
  .wl-in.sm{min-height:48px;font-size:16px}
  .wl-list{display:flex;flex-direction:column;gap:8px}.wl-item{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px 14px;border:2px solid var(--line);border-radius:16px;background:var(--surface-2);cursor:pointer;font:inherit;color:var(--ink)}.wl-item:hover{border-color:var(--brand)}.wl-item b{display:block}.wl-item small{color:var(--muted)}
  .sync-btn{position:relative}.sync-btn .sync-n{position:absolute;top:1px;right:1px;min-width:16px;height:16px;border-radius:8px;background:var(--brand);color:#fff;font:700 10px/16px var(--font);text-align:center;font-style:normal;padding:0 3px}.sync-btn .sync-n:empty{display:none}
  .sync-btn[data-state=syncing] .ic{animation:spin 1s linear infinite}.sync-btn[data-state=idle]{color:var(--ok)}.sync-btn[data-state=offline],.sync-btn[data-state=readonly]{color:var(--warn)}.sync-btn[data-state=error],.sync-btn[data-state=revoked],.sync-btn[data-state=removed]{color:var(--bad)}
  @media(max-width:699px){.sync-btn{display:none}}
  .bn-more .sync-dot{position:absolute;top:7px;left:calc(50% + 6px);width:10px;height:10px;border-radius:50%;border:2px solid var(--surface);display:none;background:var(--info)}
  .bn-more[data-state=syncing] .sync-dot,.bn-more[data-state=offline] .sync-dot,.bn-more[data-state=readonly] .sync-dot,.bn-more[data-state=error] .sync-dot,.bn-more[data-state=revoked] .sync-dot,.bn-more[data-state=removed] .sync-dot{display:block}
  .bn-more[data-state=offline] .sync-dot,.bn-more[data-state=readonly] .sync-dot{background:var(--warn)}.bn-more[data-state=error] .sync-dot,.bn-more[data-state=revoked] .sync-dot,.bn-more[data-state=removed] .sync-dot{background:var(--bad)}
  .acct-kv{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:14px}.acct-kv dt{color:var(--muted)}.acct-kv dd{margin:0;font-weight:600}
  .acct-use{display:flex;flex-direction:column;gap:12px}.acct-use .top{display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px}.acct-use .top b{font-weight:700}
  .acct-note{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-2);font-size:13.5px}.acct-note .ic{flex:none;width:17px;height:17px;margin-top:2px;color:var(--warn)}
  .acct-code{font:600 13px/1.5 ui-monospace,Menlo,Consolas,monospace;word-break:break-all;padding:12px;border-radius:12px;background:var(--surface-2);border:1px dashed var(--line);user-select:all}
  `);

  const dt = (iso) => (iso ? U.fmtDate(String(iso).slice(0, 10)) : '—');
  const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));
  const mb = (b) => U.num(Number(b) / 1048576, Number(b) < 10485760 ? 1 : 0) + ' MB';
  const wlShell = (html) => { document.getElementById('app').innerHTML = `<div class="wl"><div class="wl-card">${SS.welcome.art()}<div class="wl-body"><div class="wl-step">${html}</div></div></div></div>`; };
  const errBox = () => '<div class="wl-err" id="acErr" role="alert" hidden></div>';
  const showErr = (m) => { const e = $('#acErr'); if (e) { e.textContent = m || ''; e.hidden = !m; } };
  const legal = () => {
    const l = (url, t) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${t}</a>` : `<span>${t}</span>`);
    return `${l(cfg.termsUrl, 'Kullanım Koşulları')} ve ${l(cfg.privacyUrl, 'Gizlilik / KVKK Aydınlatma Metni')}`;
  };
  async function guarded(btn, label, fn) {
    const old = btn.innerHTML; btn.disabled = true; btn.textContent = label;
    try { return await fn(); } catch (e) { console.error(e); showErr(C().msg(e)); } finally { btn.disabled = false; btn.innerHTML = old; }
  }

  /* =====================================================================
     Giriş / kayıt / şifre sıfırlama (tam ekran). Oturum açılınca çözülür.
     ===================================================================== */
  A.auth = (mode = 'login', pre = {}) => new Promise((resolve) => {
    let email = pre.email || '', name = '';
    const done = (session) => resolve(session);
    const go = (m, extra) => { mode = m; Object.assign(pre, extra || {}); draw(); };

    function draw() {
      if (mode === 'login') {
        wlShell(`<div><h1>Şantiye Şefi</h1><p style="margin-top:6px">Hesabınıza giriş yapın</p></div>
          <input class="wl-in sm" id="acEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="E-posta adresi" value="${esc(email)}" aria-label="E-posta">
          <input class="wl-in sm" id="acPw" type="password" autocomplete="current-password" placeholder="Şifre" aria-label="Şifre">
          ${errBox()}${pre.notice ? `<div class="wl-info">${esc(pre.notice)}</div>` : ''}
          <button class="btn primary block" id="acGo">Giriş yap</button>
          <div class="wl-foot"><button class="wl-skip" id="acForgot">Şifremi unuttum</button><button class="wl-skip" id="acSignup"><b>Hesap oluştur</b> · 14 gün ücretsiz</button></div>`);
        const em = $('#acEmail'), pw = $('#acPw');
        const submit = () => guarded($('#acGo'), 'Giriş yapılıyor…', async () => {
          showErr(''); email = em.value.trim(); if (!email || !pw.value) return showErr('E-posta ve şifre gerekli');
          try { const s = await C().signIn(email, pw.value); done(s); }
          catch (e) { if (/not confirmed|doğrulanmadı/i.test(String(e.message) + C().msg(e))) { go('confirm', { email, notice: '' }); return; } throw e; }
        });
        $('#acGo').onclick = submit; pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
        $('#acForgot').onclick = () => { email = em.value.trim(); go('forgot'); };
        $('#acSignup').onclick = () => { email = em.value.trim(); go('signup'); };
        setTimeout(() => (email ? pw : em).focus(), 200);
      } else if (mode === 'signup') {
        wlShell(`<div><h1>Hesap oluşturun</h1><p style="margin-top:6px">14 gün ücretsiz deneyin. Kart bilgisi istenmez.</p></div>
          <div class="wl-q" id="acQ">Bana ne ile hitap etmek istersiniz?</div>
          <input class="wl-in sm" id="acName" type="text" maxlength="30" autocomplete="nickname" placeholder="Adınız veya lakabınız" aria-labelledby="acQ" value="${esc(name)}">
          <input class="wl-in sm" id="acEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="E-posta adresi" value="${esc(email)}" aria-label="E-posta">
          <input class="wl-in sm" id="acPw" type="password" autocomplete="new-password" placeholder="Şifre (en az 10 karakter)" aria-label="Şifre">
          <label class="check"><input type="checkbox" id="acTerms"><span class="wl-fine">${legal()}'ni okudum, kabul ediyorum.</span></label>
          ${errBox()}
          <button class="btn primary block" id="acGo">Hesap oluştur</button>
          <div class="wl-foot"><button class="wl-skip" id="acBack">Zaten hesabım var</button></div>`);
        $('#acGo').onclick = () => guarded($('#acGo'), 'Oluşturuluyor…', async () => {
          showErr(''); name = $('#acName').value.trim(); email = $('#acEmail').value.trim(); const pw = $('#acPw').value;
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr('Geçerli bir e-posta adresi girin');
          if (pw.length < 10) return showErr('Şifre en az 10 karakter olmalı');
          if (!$('#acTerms').checked) return showErr('Devam etmek için koşulları kabul etmelisiniz');
          const r = await C().signUp(email, pw, name);
          if (r.session) done(r.session); else go('confirm', { email });
        });
        $('#acBack').onclick = () => { email = $('#acEmail').value.trim(); go('login'); };
        setTimeout(() => $('#acName').focus(), 200);
      } else if (mode === 'confirm') {
        wlShell(`<div><h1>E-postanızı doğrulayın</h1><p style="margin-top:6px"><b>${esc(email)}</b> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra buraya dönüp giriş yapın.</p></div>
          <div class="wl-info">Gelmediyse gereksiz (spam) klasörüne bakın. Bağlantı telefonunuzdaki tarayıcıda açılabilir; doğrulama sonrası uygulamaya dönüp giriş yapmanız yeterli.</div>
          ${errBox()}<div id="acOk" class="wl-info" hidden>Doğrulama e-postası yeniden gönderildi.</div>
          <button class="btn primary block" id="acGo">Doğruladım, giriş yap</button>
          <div class="wl-foot"><button class="wl-skip" id="acResend">Tekrar gönder</button><button class="wl-skip" id="acBack">Farklı e-posta</button></div>`);
        $('#acGo').onclick = () => go('login', { notice: '' });
        $('#acResend').onclick = () => guarded($('#acResend'), 'Gönderiliyor…', async () => { showErr(''); await C().resendConfirm(email); $('#acOk').hidden = false; });
        $('#acBack').onclick = () => go('signup');
      } else if (mode === 'forgot') {
        wlShell(`<div><h1>Şifre sıfırlama</h1><p style="margin-top:6px">E-posta adresinizi girin; yeni şifre belirlemeniz için bir bağlantı gönderelim.</p></div>
          <input class="wl-in sm" id="acEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="E-posta adresi" value="${esc(email)}" aria-label="E-posta">
          ${errBox()}<div id="acOk" class="wl-info" hidden>Bağlantı gönderildi. E-postanızdaki bağlantıyı <b>bu uygulamanın web sürümünde</b> açıp yeni şifrenizi belirleyin, sonra buradan giriş yapın.</div>
          <button class="btn primary block" id="acGo">Bağlantı gönder</button>
          <div class="wl-foot"><button class="wl-skip" id="acBack">Girişe dön</button></div>`);
        $('#acGo').onclick = () => guarded($('#acGo'), 'Gönderiliyor…', async () => {
          showErr(''); email = $('#acEmail').value.trim(); if (!email) return showErr('E-posta adresi gerekli');
          await C().resetPassword(email); $('#acOk').hidden = false;
        });
        $('#acBack').onclick = () => go('login');
      } else if (mode === 'recovery') {
        wlShell(`<div><h1>Yeni şifre belirleyin</h1><p style="margin-top:6px">Hesabınız için yeni bir şifre girin (en az 10 karakter).</p></div>
          <input class="wl-in sm" id="acPw" type="password" autocomplete="new-password" placeholder="Yeni şifre" aria-label="Yeni şifre">
          <input class="wl-in sm" id="acPw2" type="password" autocomplete="new-password" placeholder="Yeni şifre (tekrar)" aria-label="Yeni şifre tekrar">
          ${errBox()}<button class="btn primary block" id="acGo">Şifreyi kaydet</button>`);
        $('#acGo').onclick = () => guarded($('#acGo'), 'Kaydediliyor…', async () => {
          showErr(''); const p = $('#acPw').value;
          if (p.length < 10) return showErr('Şifre en az 10 karakter olmalı'); if (p !== $('#acPw2').value) return showErr('Şifreler aynı değil');
          await C().updatePassword(p); const { session } = await C().init(); done(session);
        });
      }
    }
    draw();
  });

  /* =====================================================================
     Firma yok / firma seç / bağlantı gerekli
     ===================================================================== */
  A.noWorkspace = () => new Promise((resolve) => {
    wlShell(`<div><h1>Firmanızı kurun</h1><p style="margin-top:6px">Şantiye verileriniz bir <b>firmaya</b> bağlıdır; ekibiniz aynı veriyi paylaşır. 14 gün ücretsiz deneme başlar.</p></div>
      <input class="wl-in sm" id="acFirm" type="text" maxlength="60" autocomplete="organization" placeholder="Firma adı" aria-label="Firma adı">
      ${errBox()}<button class="btn primary block" id="acGo">${I('building')}Firmayı oluştur</button>
      <div class="wl-info">Bir iş arkadaşınız sizi davet ettiyse aşağıya <b>davet kodunu</b> yapıştırın.</div>
      <input class="wl-in sm" id="acCode" type="text" autocomplete="off" autocapitalize="none" placeholder="Davet kodu" aria-label="Davet kodu">
      <button class="btn block" id="acJoin">Davete katıl</button>
      <div class="wl-foot"><button class="wl-skip" id="acOut">Çıkış yap</button></div>`);
    $('#acGo').onclick = () => guarded($('#acGo'), 'Oluşturuluyor…', async () => {
      showErr(''); const id = await C().createWorkspace($('#acFirm').value.trim()); A.justCreated = id; resolve(id);
    });
    $('#acJoin').onclick = () => guarded($('#acJoin'), 'Katılınıyor…', async () => { showErr(''); const id = await C().acceptInvite($('#acCode').value); resolve(id); });
    $('#acOut').onclick = async () => { await C().signOut(); location.reload(); };
    setTimeout(() => $('#acFirm').focus(), 200);
  });

  A.pickWorkspace = (list) => new Promise((resolve) => {
    const state = { trial: 'Deneme', active: 'Aktif', past_due: 'Ek süre', suspended: 'Askıda' };
    wlShell(`<div><h1>Hangi firma?</h1><p style="margin-top:6px">Birden fazla firmanın üyesisiniz.</p></div>
      <div class="wl-list">${list.map((w) => `<button class="wl-item" data-ws="${esc(w.workspace_id)}">${I('building')}<span><b>${esc(w.name)}</b><small>${esc(ROLE[w.role] || w.role)} · ${state[w.license_state] || '—'}</small></span></button>`).join('')}</div>
      <div class="wl-foot"><button class="wl-skip" id="acOut">Çıkış yap</button></div>`);
    document.querySelectorAll('[data-ws]').forEach((b) => (b.onclick = () => resolve(list.find((w) => w.workspace_id === b.dataset.ws))));
    $('#acOut').onclick = async () => { await C().signOut(); location.reload(); };
  });

  A.needOnline = (msg) => new Promise((resolve) => {
    wlShell(`<div><h1>İnternet bağlantısı gerekli</h1><p style="margin-top:6px">${esc(msg)}</p></div>
      <button class="btn primary block" id="acGo">Tekrar dene</button><div class="wl-foot"><button class="wl-skip" id="acOut">Çıkış yap</button></div>`);
    $('#acGo').onclick = () => resolve(); $('#acOut').onclick = async () => { await C().signOut(); location.reload(); };
  });

  /* =====================================================================
     İlk bağlanış: bu cihazda eski (hesapsız) veri varsa ne yapılacağını sor
     ===================================================================== */
  A.link = async (ws) => {
    const c = C();
    if (c.useWorkspace(ws.workspace_id)) return;                          // cihaz bu firmayla zaten çalışıyor
    const lg = c.legacy();
    if (lg) {
      let empty = null;
      for (;;) {                                                          // sunucunun boş olup olmadığını öğren (internet gerekir)
        try {
          const key = c.deviceKey(ws.workspace_id);
          await c.transport.registerDevice(ws.workspace_id, key, c.deviceLabel(), window.AndroidBridge ? 'android-app' : 'web');
          const p = await c.transport.pull(ws.workspace_id, key, 0, 1); empty = Number(p.head_seq) === 0; break;
        } catch (e) { if (!e.offline) throw e; await A.needOnline('Bu cihazdaki kayıtların firmaya aktarılması için internete bağlanın.'); }
      }
      const choice = await new Promise((resolve) => {
        wlShell(empty
          ? `<div><h1>Cihazdaki verileriniz bulundu</h1><p style="margin-top:6px">Bu cihazda hesap açmadan önce girdiğiniz <b>${U.num(lg.count)} kayıt</b> var. <b>${esc(ws.name)}</b> firmasının bulutu henüz boş.</p></div>
            <div class="wl-info">Aktarırsanız bu kayıtlar firmaya yüklenir ve ekibiniz de görür. Eski kopya bu cihazda yedek olarak kalır.</div>
            <button class="btn primary block" id="lkA">${I('upload')}Kayıtları firmaya aktar</button><button class="btn block" id="lkS">Aktarma, boş başla</button>`
          : `<div><h1>Veriler birleştirilsin mi?</h1><p style="margin-top:6px">Bu cihazda <b>${U.num(lg.count)} kayıt</b>, <b>${esc(ws.name)}</b> firmasının bulutunda da veri var.</p></div>
            <div class="wl-info"><b>Birleştir:</b> ikisi birlikte kalır (aynı şeyi iki yerde girdiyseniz kayıtlar tekrarlanabilir).<br><b>Buluttakini kullan:</b> bu cihazdaki eski kayıtlar kullanılmaz (cihazda yedek olarak kalır).</div>
            <button class="btn primary block" id="lkA">${I('refresh')}Birleştir</button><button class="btn block" id="lkS">Buluttakini kullan</button>`);
        $('#lkA').onclick = () => resolve('adopt'); $('#lkS').onclick = () => resolve('skip');
      });
      if (choice === 'adopt') {
        wlShell('<div><h1>Aktarılıyor…</h1><p style="margin-top:6px">Kayıtlar ve fotoğraflar hazırlanıyor, lütfen bekleyin.</p></div>');
        await c.adoptLegacy(ws.workspace_id);
      }
    }
    SS.store.flush();
  };

  /* Çıkarılan / kaldırılan cihaz bildirimi */
  let lastAlert = '';
  A.onStatus = (st) => {
    if (st.state === lastAlert || (st.state !== 'revoked' && st.state !== 'removed')) { if (st.state !== 'revoked' && st.state !== 'removed') lastAlert = ''; return; }
    lastAlert = st.state;
    if (st.state === 'revoked') {
      ui.sheet({
        title: 'Bu cihaz çıkarıldı', cls: 'small', noFocus: true,
        body: `<p class="confirm-p">Hesabınızda aynı anda en fazla <b>2 cihaz</b> kullanılabilir; başka bir cihaz eklendiği için bu cihazın eşitlemesi durdu. Verileriniz bu cihazda duruyor, hiçbir şey silinmedi.<br><br>Bu cihazı yeniden etkinleştirirseniz hesabınızdaki <b>en eski kullanılan</b> cihaz çıkarılır.</p>`,
        footer: `<button class="btn ghost" data-sheet-close>Şimdilik kalsın</button><button class="btn primary" id="rvGo">Bu cihazı etkinleştir</button>`,
        mount(el, api) { el.parentElement.querySelector('#rvGo').onclick = async () => { api.close(); lastAlert = ''; await C().engine.reactivate(); }; },
      });
    } else {
      ui.sheet({ title: 'Firmadan çıkarıldınız', cls: 'small', noFocus: true, body: `<p class="confirm-p">Bu firmanın üyesi değilsiniz; eşitleme durduruldu. Verileriniz bu cihazda duruyor.</p>`, footer: `<button class="btn primary" id="rmOut">Çıkış yap</button>`, mount(el) { el.parentElement.querySelector('#rmOut').onclick = () => A.signOut(true); } });
    }
  };

  /* =====================================================================
     Açılış: oturum → firma → bağlanış → eşitleme. Bitince uygulama normal açılır.
     ===================================================================== */
  const PENDING_INVITE = 'santiyesefi.pendingInvite';
  A.boot = async () => {
    const c = C();
    let recovery = false;
    c.onAuth((ev) => { if (ev === 'PASSWORD_RECOVERY') recovery = true; });
    /* E-postadaki davet bağlantısı (#/davet/<kod>): kod saklanır, adres çubuğundan silinir; giriş yapılınca otomatik kabul edilir */
    const dm = /^#\/davet\/([0-9a-f]{64})$/i.exec(location.hash);
    if (dm) { try { sessionStorage.setItem(PENDING_INVITE, dm[1]); } catch (e) { /* */ } history.replaceState(null, '', location.pathname + location.search); }
    let { session } = await c.init();
    if (recovery) { await A.auth('recovery'); session = (await c.init()).session; }
    while (!session) session = await A.auth('login');
    c.user = session.user || c.user;
    let pending = null; try { pending = sessionStorage.getItem(PENDING_INVITE); sessionStorage.removeItem(PENDING_INVITE); } catch (e) { /* */ }
    if (pending) {
      try { const id = await c.acceptInvite(pending); c.setActiveWs(id); A.notice = ['Davet kabul edildi, firmaya katıldınız', 'ok']; }
      catch (e) { A.notice = [`Davet kabul edilemedi: ${c.msg(e)}`, 'bad']; }
    }

    let ws = null;
    for (;;) {
      let r;
      try { r = await c.myWorkspaces(); }
      catch (e) { if (e.code === 'PGRST301' || /JWT|not_authenticated/i.test(e.message)) { await c.signOut(); location.reload(); return new Promise(() => {}); } throw e; }
      const list = r.list;
      if (!list.length) { if (r.offline) { await A.needOnline('Henüz firma bilgileriniz indirilmedi.'); continue; } await A.noWorkspace(); continue; }
      const saved = c.activeWs();
      ws = list.find((w) => w.workspace_id === saved) || (list.length === 1 ? list[0] : await A.pickWorkspace(list));
      if (r.offline && !c.cachedLicense(ws.workspace_id) && !c.hasWorkspaceData(ws.workspace_id)) { await A.needOnline('Lisans bilginizi doğrulamak için internete bağlanmanız gerekiyor.'); continue; }
      if (r.offline && !c.cachedLicense(ws.workspace_id)) { await A.needOnline('Son lisans doğrulamanızın üzerinden 14 günden fazla geçti; devam etmek için internete bağlanın.'); continue; }
      break;
    }
    c.setActiveWs(ws.workspace_id);
    /* Bu cihazdaki yerel kopya başka bir kullanıcıya aitse (ör. önceki kullanıcının oturumu süresi dolmuştu) silinir: kimse başkasının
       bekleyen değişikliklerini kendi adına göndermesin / başkasının verisini görmesin. */
    const ownerKey = `santiyesefi.owner.${ws.workspace_id}`, owner = localStorage.getItem(ownerKey);
    if (owner && c.user && owner !== c.user.id) await c.clearLocal(ws.workspace_id);
    const fresh = !c.hasWorkspaceData(ws.workspace_id);
    await A.link(ws);

    /* profil adı → hitap; ilk açılış sihirbazı bulut kipinde atlanır */
    let pname = '';
    try { const p = await c.profile(); pname = p && p.display_name; } catch (e) { /* çevrimdışı */ }
    if (pname && (fresh || !SS.cfg.user || SS.cfg.user === 'Şef')) SS.cfg.user = pname;
    if (!SS.cfg.user) SS.cfg.user = 'Şef';
    SS.cfg.onboarded = true;
    if (fresh && A.justCreated === ws.workspace_id && !SS.cfg.company) SS.cfg.company = ws.name;   // firmayı kuran kişi için rapor başlığı
    if (c.user) try { localStorage.setItem(ownerKey, c.user.id); } catch (e) { /* */ }
    SS.store.flush();
    A.ws = ws;
    return c.startSync();
  };

  /* Kabuk çizildikten sonra: açılışta oluşan bildirimler (ör. davet sonucu) */
  A.afterShell = () => { if (A.notice) { ui.toast(A.notice[0], A.notice[1]); A.notice = null; } };

  A.signOut = async (force) => {
    const c = C(), eng = c.engine;
    const pending = eng ? eng.pendingCount() : 0;
    const ok = force || await ui.confirm({
      title: 'Çıkış yapılsın mı?', ok: 'Çıkış yap', danger: !!pending,
      text: pending ? `<b>${pending} bekleyen değişiklik</b> henüz buluta gönderilmedi. Çıkış yaparsanız bu cihazdaki yerel kopya silineceği için <b>bu değişiklikler kaybolur</b>. Önce internete bağlanıp eşitlemeniz önerilir.` : 'Bu cihazdaki yerel kopya silinir; verileriniz bulutta güvende kalır ve giriş yapınca geri gelir.',
    });
    if (!ok) return;
    if (!force && pending) { try { await c.syncNow(); } catch (e) { /* */ } if (eng.pendingCount() && !(await ui.confirm({ title: 'Eşitlenemeyen değişiklikler var', text: `<b>${eng.pendingCount()} değişiklik</b> buluta gönderilemedi. Yine de çıkış yapılsın mı?`, ok: 'Yine de çık' }))) return; }
    SS.store.frozen = true; clearTimeout(SS.store._t);                   // önce depoyu dondur: sayfa yenilenirken (pagehide) silinen veri geri yazılmasın
    const wsId = c.ws; await c.signOut(); c.setActiveWs(null); if (wsId) await c.clearLocal(wsId);
    location.reload();
  };

  /* =====================================================================
     Hesap & Lisans ekranı
     ===================================================================== */
  const D = (A.data = { info: null, team: null, invites: null, devices: null, offline: false, err: '' });
  const isManager = () => D.info && ['owner', 'admin'].includes(D.info.role);

  V.render = () => `<div class="page">${ui.head({ title: 'Hesap & Lisans', sub: esc(A.ws ? A.ws.name : '') })}<div id="acctRoot"><div class="card pad"><p class="muted">Yükleniyor…</p></div></div></div>`;
  V.mount = () => { A.load(); };

  A.load = async () => {
    const c = C(), ws = c.ws;
    D.err = ''; D.offline = false;
    try { D.info = await c.licenseInfo(ws); }
    catch (e) { if (e.offline) { D.offline = true; D.info = e.cached || c.cache()[`info.${ws}`] || null; } else D.err = c.msg(e); }
    if (!D.offline && D.info) {
      const [team, inv, dev] = await Promise.all([
        c.team(ws).catch(() => null),
        isManager() ? c.pendingInvites(ws).catch(() => null) : null,
        c.myDevices(ws).catch(() => null),
      ]);
      D.team = team; D.invites = inv; D.devices = dev;
    }
    V.paint();
  };

  function licenseCard() {
    const i = D.info; if (!i) return `<div class="card pad stack"><h3>Lisans</h3><p class="muted">${esc(D.err || 'Lisans bilgisi alınamadı.')}</p></div>`;
    const L = i.license, T = i.terminals, P = i.projects, S = i.storage;
    const stateTxt = { trial: `Deneme sürümü · ${daysLeft(L.trial_ends_at)} gün kaldı`, active: 'Aktif', past_due: 'Ödeme gecikti · ek süredesiniz', suspended: 'Askıda · salt okunur' }[L.state] || L.state;
    const tone = { trial: 'info', active: 'ok', past_due: 'warn', suspended: 'bad' }[L.state] || 'muted';
    const row = (label, used, limit, text, extra = '') => `<div><div class="top"><span>${label}</span><b>${text}</b></div>${limit ? ui.bar((used / limit) * 100, used >= limit ? 'warn' : 'brand') : ''}${extra}</div>`;
    const note = L.state === 'suspended' ? `<div class="acct-note">${I('alert')}<span>Lisansınız askıda: verilerinizi <b>görebilir ve dışa aktarabilirsiniz</b>, yeni kayıt eklenemez. Bu cihazdaki değişiklikler bekletilir; lisans yenilenince buluta gönderilir.</span></div>` : L.state === 'past_due' ? `<div class="acct-note">${I('alert')}<span>Ödemeniz gecikti. ${L.grace_until ? `<b>${dt(L.grace_until)}</b> tarihine kadar` : 'Kısa süre'} kullanmaya devam edebilirsiniz.</span></div>` : '';
    return `<div class="card pad stack"><div class="row between wrap"><h3>${esc(i.plan.name)} paketi</h3><span class="badge ${tone}">${esc(stateTxt)}</span></div>
      <dl class="acct-kv"><dt>Firma</dt><dd>${esc(i.workspace.name)}</dd><dt>Rolünüz</dt><dd>${esc(ROLE[i.role] || i.role)}</dd>
        ${L.current_period_end ? `<dt>Dönem sonu</dt><dd>${dt(L.current_period_end)} · ${L.billing_period === 'yearly' ? 'yıllık' : 'aylık'}</dd>` : ''}
        <dt>Şantiye AI</dt><dd>${i.plan.ai_questions_per_terminal} soru / terminal / ay${i.plan.ai_deep_per_terminal ? ` + ${i.plan.ai_deep_per_terminal} derin analiz` : ''}</dd></dl>
      <div class="acct-use">
        ${row('Terminal (kullanıcı)', T.reserved, T.limit, `${T.members} / ${T.limit}${T.reserved > T.members ? ` <small class="muted">(+${T.reserved - T.members} bekleyen davet)</small>` : ''}`)}
        ${i.viewers.limit ? row('Ücretsiz izleyici', i.viewers.reserved, i.viewers.limit, `${i.viewers.reserved} / ${i.viewers.limit}`) : ''}
        ${row('Aktif şantiye', P.used, P.limit, P.limit ? `${P.used} / ${P.limit}` : `${P.used} · sınırsız`)}
        ${row('Depolama (foto, belge)', Number(S.used_bytes), Number(S.limit_bytes), `${mb(S.used_bytes)} / ${mb(S.limit_bytes)}`)}
      </div>${note}
      <p class="wl-fine">Paket değiştirme ve ödeme işlemleri web sitemizden yapılır.</p></div>`;
  }

  function syncCard() {
    const st = C().status || {}, eng = C().engine, ns = (eng ? eng.notices : []).slice(-12).reverse();
    const label = { idle: 'Eşitlendi', syncing: 'Eşitleniyor…', offline: 'Çevrimdışı', readonly: 'Salt okunur (lisans askıda)', revoked: 'Cihaz çıkarıldı', removed: 'Firmadan çıkarıldınız', error: 'Hata' }[st.state] || '—';
    const tone = { idle: 'ok', syncing: 'info', offline: 'warn', readonly: 'warn', revoked: 'bad', removed: 'bad', error: 'bad' }[st.state] || 'muted';
    const ago = st.lastSyncAt ? `${Math.max(0, Math.round((Date.now() - st.lastSyncAt) / 60000))} dk önce` : 'henüz yok';
    return `<div class="card pad stack" id="acctSync"><div class="row between wrap"><h3>Eşitleme</h3><span class="badge ${tone}">${label}</span></div>
      <dl class="acct-kv"><dt>Son eşitleme</dt><dd>${ago}</dd><dt>Bekleyen değişiklik</dt><dd>${st.pending || 0}</dd><dt>Bu cihaz</dt><dd>${esc(C().deviceLabel())}</dd></dl>
      ${st.message ? `<p class="muted">${esc(st.message)}</p>` : ''}
      <div class="row wrap"><button class="btn primary" data-action="acct.sync">${I('refresh')}Şimdi eşitle</button>${ns.length ? `<button class="btn ghost" data-action="acct.notices.clear">Bildirimleri temizle</button>` : ''}</div>
      ${ns.length ? `<div class="stack">${ns.map(noticeRow).join('')}</div>` : ''}</div>`;
  }
  function noticeRow(n) {
    let [coll, id] = n.key ? [n.key.split('/')[0], n.key.slice(n.key.indexOf('/') + 1)] : [null, null];
    const el = coll && SS.D[coll] && SS.D[coll].find && SS.D[coll].find((x) => x.id === id);
    const nm = el ? ` “${esc(el.name || el.title || el.desc || el.element || '')}”` : '';
    const what = `${COLL[coll] || 'Kayıt'}${nm}`;
    const msg = {
      fields: `${what}: başka biriyle aynı alanı (${esc((n.fields || []).join(', '))}) değiştirdiniz — sizin değeriniz kullanıldı.`,
      deleted_remote: `${what}: başka biri sildi; sizin düzenlemeniz geçersiz kaldı.`,
      reverted_role: `${n.count} değişiklik, rolünüz (${esc(ROLE[n.role] || n.role)}) için yetkili olmadığından geri alındı.`,
      reverted_server: `${what}: sunucu bu değişikliği kabul etmedi, eski haline döndü.`,
      rejected: `${what}: ${esc(C().msg({ message: n.code }))} — yalnızca bu cihazda kalıyor, bulutta yok.`,
      storage_quota: 'Depolama kotası doldu: yeni fotoğraf/belgeler yüklenmedi.',
      blob_failed: 'Bir dosya yüklenemedi (sonra yeniden denenecek).',
    }[n.kind] || esc(n.kind);
    return `<div class="acct-note">${I('info')}<span>${msg}<br><small class="muted">${new Date(n.at).toLocaleString('tr-TR')}</small></span></div>`;
  }

  function teamCard() {
    if (!D.team) return '';
    const mgr = isManager(), me = C().user && C().user.id, i = D.info;
    const roles = (i.plan.allowed_roles || []).filter((r) => r !== 'owner');
    const head = `<div class="row between wrap"><h3>Ekip</h3>${mgr ? `<button class="btn primary sm" data-action="acct.invite">${I('plus')}Kişi davet et</button>` : ''}</div>`;
    const rows = D.team.map((m) => {
      const self = m.user_id === me, canEdit = mgr && !self && m.role !== 'owner' && !(i.role === 'admin' && m.role === 'admin');
      const roleCell = canEdit ? `<select class="input sm" data-acct-role="${esc(m.user_id)}" aria-label="Rol">${roles.filter((r) => i.role === 'owner' || r !== 'admin' || m.role === 'admin').map((r) => `<option value="${r}" ${r === m.role ? 'selected' : ''}>${ROLE[r]}</option>`).join('')}</select>` : `<span class="badge muted">${esc(ROLE[m.role] || m.role)}</span>`;
      return `<tr><td><b>${esc(m.display_name || m.email.split('@')[0])}</b>${self ? ' <span class="badge brand">Siz</span>' : ''}<br><small class="muted">${esc(m.email)}</small></td><td>${roleCell}</td><td>${m.active_devices}</td>
        <td style="text-align:right">${canEdit ? `<button class="btn ghost sm" data-action="acct.remove" data-uid="${esc(m.user_id)}" data-name="${esc(m.display_name || m.email)}">${I('trash')}</button>` : self && m.role !== 'owner' ? `<button class="btn ghost sm" data-action="acct.leave">Ayrıl</button>` : ''}</td></tr>`;
    }).join('');
    const inv = (D.invites || []).map((v) => `<tr><td><b>${esc(v.email)}</b><br><small class="muted">davet · ${dt(v.expires_at)} tarihine kadar geçerli</small></td><td><span class="badge info">${esc(ROLE[v.role] || v.role)}</span></td><td>—</td><td style="text-align:right"><button class="btn ghost sm" data-action="acct.invite.revoke" data-id="${esc(v.id)}">İptal</button></td></tr>`).join('');
    return `<div class="card pad stack">${head}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kişi</th><th>Rol</th><th>Cihaz</th><th></th></tr></thead><tbody>${rows}${inv}</tbody></table></div></div>`;
  }

  function devicesCard() {
    if (!D.devices) return '';
    const mine = C().deviceKey(C().ws);
    return `<div class="card pad stack"><h3>Cihazlarım</h3><p class="muted">Bir hesapta aynı anda en fazla ${D.info ? D.info.plan.devices_per_terminal : 2} cihaz kullanılabilir.</p>
      ${D.devices.map((d) => `<div class="acct-note">${I('info')}<span><b>${esc(d.label || d.platform || 'Cihaz')}</b>${d.device_key === mine ? ' <span class="badge brand">Bu cihaz</span>' : ''}${d.revoked_at ? ' <span class="badge bad">Çıkarıldı</span>' : ''}<br><small class="muted">Son görülme: ${new Date(d.last_seen_at).toLocaleString('tr-TR')}</small></span></div>`).join('')}</div>`;
  }

  function accountCard() {
    const c = C(), cc = c.cache();
    return `<div class="card pad stack"><h3>Hesabım</h3>
      <dl class="acct-kv"><dt>E-posta</dt><dd>${esc((c.user && c.user.email) || cc.email || '')}</dd><dt>Hitap adı</dt><dd>${esc(SS.cfg.user)}</dd></dl>
      <div class="row wrap"><button class="btn" data-action="acct.name">Adı değiştir</button><button class="btn" data-action="acct.pw">Şifre değiştir</button><button class="btn" data-action="acct.ws.new">Yeni firma</button><button class="btn" data-action="acct.ws.join">Davet kodu gir</button><button class="btn" data-action="acct.ws.switch">Firma değiştir</button><button class="btn danger-ghost" data-action="acct.signout">Çıkış yap</button></div></div>`;
  }

  V.paint = () => {
    const root = $('#acctRoot'); if (!root) return;
    root.innerHTML = `${D.offline ? `<div class="acct-note" style="margin-bottom:14px">${I('alert')}<span>İnternet yok — son bilinen lisans bilgisi gösteriliyor.</span></div>` : ''}
      <div class="grid g-2">${licenseCard()}${syncCard()}</div><div class="grid g-2" style="margin-top:14px">${teamCard()}${devicesCard()}${accountCard()}</div>`;
    ui.hydrate(root);
  };
  V.paintSync = () => { const el = $('#acctSync'); if (el) { el.outerHTML = syncCard(); ui.hydrate($('#acctRoot')); } };

  /* ---------- eylemler ---------- */
  const A_ = SS.actions;
  A_['acct.open'] = () => ui.go('account');
  A_['acct.sync'] = async () => { ui.toast('Eşitleniyor…', 'info'); const st = await C().syncNow(); V.paintSync(); ui.toast(st.state === 'idle' ? 'Eşitlendi' : st.message || 'Eşitleme tamamlanamadı', st.state === 'idle' ? 'ok' : 'bad'); };
  A_['acct.notices.clear'] = () => { if (C().engine) C().engine.clearNotices(); V.paintSync(); };

  function showInvite(r, role) {
    const code = r.token, body = `Şantiye Şefi'ne katılmanız için davet edildiniz (${ROLE[role]}).\n\n1) Uygulamayı açın, ${r.email} adresiyle hesap oluşturun\n2) "Firmanızı kurun" ekranında "Davet kodu" alanına şunu yapıştırın:\n\n${code}\n\nKod ${dt(r.expires_at)} tarihine kadar geçerlidir.`;
    ui.sheet({
      title: 'Davet hazır', cls: 'small', noFocus: true,
      body: `<p class="confirm-p"><b>${esc(r.email)}</b> için davet ${r.emailed ? 'oluşturuldu ve <b>e-postayla gönderildi</b>' : 'kodu oluşturuldu'}. ${r.emailed ? 'E-postadaki bağlantı daveti kabul ettirir; kod aşağıda yedek olarak da durur.' : 'Kodu kişiye iletin.'} Yalnızca bu e-posta adresiyle açılan hesap kullanabilir.</p><div class="acct-code" id="invCode">${esc(code)}</div><p class="wl-fine" style="margin-top:10px">Güvenlik için kod yalnızca şimdi gösterilir.${r.emailed ? '' : ' (E-posta ile otomatik gönderim, yönetici ayarlarını yapınca açılır.)'}</p>`,
      footer: `<a class="btn ghost" href="mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent('Şantiye Şefi daveti')}&body=${encodeURIComponent(body)}">E-posta ile gönder</a><button class="btn primary" id="invCopy">${I('copy')}Kodu kopyala</button>`,
      mount(el) { el.parentElement.querySelector('#invCopy').onclick = async () => { try { await navigator.clipboard.writeText(code); ui.toast('Kod kopyalandı'); } catch (e) { const r2 = document.createRange(); r2.selectNodeContents($('#invCode')); const s = getSelection(); s.removeAllRanges(); s.addRange(r2); ui.toast('Kodu seçili metinden kopyalayın', 'info'); } }; },
    });
  }
  A_['acct.invite'] = () => {
    const roles = (D.info.plan.allowed_roles || []).filter((r) => r !== 'owner' && (r !== 'admin' || D.info.role === 'owner'));
    ui.form({
      title: 'Kişi davet et', cls: 'small', submit: 'Davet kodu oluştur',
      fields: [
        { name: 'email', label: 'E-posta adresi', type: 'email', required: true, full: true, placeholder: 'kisi@firma.com' },
        { name: 'role', label: 'Rol', type: 'select', full: true, options: roles.map((r) => [r, `${ROLE[r]} — ${ROLE_HINT[r] || ''}`]), value: roles.includes('chief') ? 'chief' : roles[0] },
      ],
      async onSubmit(v) {
        try { const r = await C().invite(C().ws, v.email, v.role); showInvite(r, v.role); A.load(); }
        catch (e) { ui.toast(C().msg(e), 'bad'); return false; }
      },
    });
  };
  A_['acct.invite.revoke'] = async (el) => { try { await C().revokeInvite(el.dataset.id); ui.toast('Davet iptal edildi', 'info'); A.load(); } catch (e) { ui.toast(C().msg(e), 'bad'); } };
  A_['acct.remove'] = async (el) => {
    if (!(await ui.confirm({ title: 'Üye çıkarılsın mı?', text: `<b>${esc(el.dataset.name)}</b> firmadan çıkarılır ve verilere erişimi hemen kesilir. Koltuğu boşalır.`, ok: 'Çıkar' }))) return;
    try { await C().removeMember(C().ws, el.dataset.uid); ui.toast('Üye çıkarıldı', 'info'); A.load(); } catch (e) { ui.toast(C().msg(e), 'bad'); }
  };
  A_['acct.leave'] = async () => {
    if (!(await ui.confirm({ title: 'Firmadan ayrılmak istiyor musunuz?', text: 'Bu firmanın verilerine erişiminiz kapanır. Tekrar katılmak için yeni bir davet gerekir.', ok: 'Ayrıl' }))) return;
    try { await C().removeMember(C().ws, C().user.id); await A.signOut(true); } catch (e) { ui.toast(C().msg(e), 'bad'); }
  };
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-acct-role]'); if (!sel) return;
    try { await C().setRole(C().ws, sel.dataset.acctRole, sel.value); ui.toast('Rol güncellendi'); A.load(); } catch (err) { ui.toast(C().msg(err), 'bad'); A.load(); }
  });
  A_['acct.name'] = () => ui.form({
    title: 'Hitap adı', cls: 'small', values: { name: SS.cfg.user },
    fields: [{ name: 'name', label: 'Bana şöyle hitap edin', required: true, full: true }],
    async onSubmit(v) { try { await C().setDisplayName(v.name); } catch (e) { /* çevrimdışı: yerelde kalsın */ } SS.cfg.user = v.name.slice(0, 30); SS.store.save(); ui.shell(); ui.route('quiet'); },
  });
  A_['acct.pw'] = () => ui.form({
    title: 'Şifre değiştir', cls: 'small', submit: 'Şifreyi değiştir',
    fields: [{ name: 'p1', label: 'Yeni şifre (en az 10 karakter)', type: 'password', required: true, full: true }, { name: 'p2', label: 'Yeni şifre (tekrar)', type: 'password', required: true, full: true }],
    validate: (v) => (v.p1.length < 10 ? 'Şifre en az 10 karakter olmalı' : v.p1 !== v.p2 ? 'Şifreler aynı değil' : ''),
    async onSubmit(v) { try { await C().updatePassword(v.p1); ui.toast('Şifre değiştirildi'); } catch (e) { ui.toast(C().msg(e), 'bad'); return false; } },
  });
  A_['acct.ws.new'] = () => ui.form({
    title: 'Yeni firma', cls: 'small', submit: 'Oluştur ve geç',
    fields: [{ name: 'name', label: 'Firma adı', required: true, full: true }, { type: 'html', html: '<p class="wl-fine">14 gün ücretsiz deneme başlar. Bu cihaz yeni firmaya geçer; mevcut firmanıza istediğiniz zaman "Firma değiştir" ile dönebilirsiniz.</p>' }],
    async onSubmit(v) { try { const id = await C().createWorkspace(v.name); C().setActiveWs(id); A.justCreated = id; location.reload(); } catch (e) { ui.toast(C().msg(e), 'bad'); return false; } },
  });
  A_['acct.ws.join'] = () => ui.form({
    title: 'Davet kodu gir', cls: 'small', submit: 'Katıl',
    fields: [{ name: 'code', label: 'Davet kodu', required: true, full: true }],
    async onSubmit(v) { try { const id = await C().acceptInvite(v.code); C().setActiveWs(id); location.reload(); } catch (e) { ui.toast(C().msg(e), 'bad'); return false; } },
  });
  A_['acct.ws.switch'] = () => { C().setActiveWs(null); location.reload(); };
  A_['acct.signout'] = () => A.signOut(false);
})();
