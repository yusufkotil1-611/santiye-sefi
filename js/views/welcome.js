/* Şantiye Şefi — ilk açılış karşılama akışı ("Bana ne ile hitap etmek istersiniz?") ve eski örnek veri temizliği */
(function () {
  const SS = window.SS, U = SS.U, ui = SS.ui, esc = U.esc;
  const W = (SS.welcome = {});

  SS.css(`
  .wl{min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:radial-gradient(1100px 520px at 12% -10%,color-mix(in srgb,var(--brand) 16%,transparent),transparent 60%),radial-gradient(900px 480px at 100% 110%,color-mix(in srgb,var(--info) 14%,transparent),transparent 60%),var(--bg)}
  .wl-card{width:min(520px,100%);background:var(--surface);border:1px solid var(--line);border-radius:26px;box-shadow:0 20px 60px rgba(22,25,29,.14);overflow:hidden;animation:pop .45s var(--ease) both}
  .wl-art{display:block;width:100%;height:auto;background:linear-gradient(180deg,color-mix(in srgb,var(--brand) 9%,var(--surface)),var(--surface))}
  .wl-body{padding:6px 28px 28px;display:flex;flex-direction:column;gap:16px}
  .wl-step{display:flex;flex-direction:column;gap:14px;animation:rise .45s var(--ease) both}
  .wl h1{font-size:25px;letter-spacing:-.025em;line-height:1.2}.wl h2{font-size:22px;letter-spacing:-.02em;line-height:1.25}
  .wl p{color:var(--muted);font-size:14.5px}
  .wl-q{font-size:17px;font-weight:700;color:var(--ink)}
  .wl-in{width:100%;min-height:54px;padding:0 16px;border:2px solid var(--line);border-radius:16px;background:var(--surface-2);font:600 18px var(--font);color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s}
  .wl-in:focus{border-color:var(--brand);box-shadow:0 0 0 4px color-mix(in srgb,var(--brand) 16%,transparent)}
  .wl-chips{display:flex;gap:8px;flex-wrap:wrap}
  .wl-foot{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
  .wl-skip{background:none;border:0;color:var(--muted);font-weight:600;cursor:pointer;padding:8px 4px}.wl-skip:hover{color:var(--ink)}
  .wl-dots{display:flex;gap:6px;justify-content:center}.wl-dots i{width:7px;height:7px;border-radius:50%;background:var(--line)}.wl-dots i.on{background:var(--brand);width:22px;border-radius:6px}
  .wl-hook{animation:sway 3.2s ease-in-out infinite;transform-origin:206px 34px}@keyframes sway{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}}
  .wl-feat{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wl-feat span{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--ink-2);padding:9px 11px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-2)}.wl-feat .ic{width:17px;height:17px;color:var(--brand)}
  @media(max-width:480px){.wl-body{padding:4px 20px 22px}.wl-feat{grid-template-columns:1fr}}
  `);

  const art = () => `<svg class="wl-art" viewBox="0 0 320 190" role="img" aria-label="Şantiye ve vinç çizimi">
    <rect x="0" y="166" width="320" height="24" fill="color-mix(in srgb,var(--brand) 14%,var(--surface))"/><rect x="0" y="166" width="320" height="3" fill="var(--brand)" opacity=".55"/>
    <g fill="none" stroke="var(--ink-2)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".85">
      <path d="M52 166V74h112v92M52 110h112M52 138h112M52 74l112 36M164 74 52 110M88 74v92M126 74v92"/>
    </g>
    <g fill="color-mix(in srgb,var(--info) 30%,transparent)"><rect x="92" y="114" width="30" height="20" rx="2"/><rect x="130" y="142" width="30" height="20" rx="2"/><rect x="56" y="142" width="28" height="20" rx="2"/></g>
    <g stroke="var(--brand)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M232 166V26M244 166V26M232 166l12-20-12-20 12-20-12-20 12-20-12-20"/><path d="M232 146l12 20M232 126l12 20M232 106l12 20M232 86l12 20M232 66l12 20"/>
    </g>
    <rect x="96" y="20" width="204" height="9" rx="2" fill="var(--brand)"/><rect x="262" y="14" width="30" height="16" rx="3" fill="var(--ink)"/><rect x="288" y="29" width="22" height="14" rx="2" fill="var(--ink-2)"/>
    <path d="M238 12 96 26M238 12l62 14" stroke="var(--ink-2)" stroke-width="1.6" fill="none"/>
    <g class="wl-hook"><path d="M206 29v62" stroke="var(--ink-2)" stroke-width="2"/><rect x="190" y="91" width="32" height="14" rx="3" fill="var(--brand-hi)"/><path d="M196 105l-6 14h44l-6-14" stroke="var(--ink-2)" stroke-width="1.6" fill="none"/></g>
    <g fill="var(--ink-2)" opacity=".6"><circle cx="30" cy="158" r="4"/><rect x="26" y="162" width="8" height="4" rx="1"/></g>
  </svg>`;

  W.art = art;
  const NAMES = ['Şefim', 'Hocam', 'Usta', 'Müdürüm', 'Mühendis'];
  const dots = (n, i) => `<div class="wl-dots">${Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`;

  /* Tam ekran karşılama: hitap adı → firma adı. Bitince Promise çözülür. */
  W.run = () => new Promise((resolve) => {
    const root = document.getElementById('app');
    let name = '', firm = '';
    const finish = (goProject) => {
      SS.cfg.user = name || 'Şef'; SS.cfg.company = firm; SS.cfg.onboarded = true; SS.store.flush();
      SS.welcome.wantsProject = !!goProject; resolve();
    };
    const step1 = () => {
      root.innerHTML = `<div class="wl"><div class="wl-card">${art()}<div class="wl-body"><div class="wl-step">
        <div><h1>Şantiye Şefi'ne hoş geldiniz</h1><p style="margin-top:6px">Şantiyenizin harcama, stok, personel, hakediş ve satış işlerini tek yerden yönetin. Her şey bu cihazda, sizde kalır.</p></div>
        <div class="wl-q" id="wlQ">Bana ne ile hitap etmek istersiniz?</div>
        <input class="wl-in" id="wlName" type="text" maxlength="30" autocomplete="off" autocapitalize="words" placeholder="Adınız veya lakabınız" aria-labelledby="wlQ" value="${esc(name)}">
        <div class="wl-chips">${NAMES.map((n) => `<button type="button" class="chip" data-nm="${n}">${n}</button>`).join('')}</div>
        <div class="wl-foot"><button type="button" class="wl-skip" id="wlSkip">Şimdilik geç</button><button type="button" class="btn primary" id="wlNext">Devam ${ui.icon('chevR')}</button></div>
        ${dots(2, 0)}</div></div></div></div>`;
      const inp = document.getElementById('wlName');
      const go = () => { name = inp.value.trim(); step2(); };
      document.getElementById('wlNext').onclick = go;
      document.getElementById('wlSkip').onclick = () => { name = ''; step2(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      root.querySelectorAll('[data-nm]').forEach((b) => (b.onclick = () => { inp.value = b.dataset.nm; inp.focus(); }));
      setTimeout(() => inp.focus(), 250);
    };
    const step2 = () => {
      const hello = name ? `Memnun oldum, ${esc(name)}!` : 'Hoş geldiniz!';
      root.innerHTML = `<div class="wl"><div class="wl-card">${art()}<div class="wl-body"><div class="wl-step">
        <div><h2>${hello}</h2><p style="margin-top:6px">Birkaç saniyede hazırız. Firmanızın adı rapor ve belge başlıklarında görünür (isteğe bağlı, sonra Ayarlar'dan değiştirebilirsiniz).</p></div>
        <input class="wl-in" id="wlFirm" type="text" maxlength="60" autocomplete="organization" placeholder="Firma adı (isteğe bağlı)" value="${esc(firm)}" aria-label="Firma adı">
        <div class="wl-feat"><span>${ui.icon('receipt')}Harcama & ödeme</span><span>${ui.icon('box')}Stok & malzeme</span><span>${ui.icon('users')}Puantaj & maaş</span><span>${ui.icon('sparkles')}Şantiye AI asistanı</span></div>
        <div class="wl-foot"><button type="button" class="wl-skip" id="wlBack">Geri</button><div class="row wrap"><button type="button" class="btn" id="wlLater">Sonra eklerim</button><button type="button" class="btn primary" id="wlGo">${ui.icon('building')}İlk şantiyemi ekle</button></div></div>
        ${dots(2, 1)}</div></div></div></div>`;
      const inp = document.getElementById('wlFirm');
      document.getElementById('wlBack').onclick = step1;
      document.getElementById('wlLater').onclick = () => { firm = inp.value.trim(); finish(false); };
      document.getElementById('wlGo').onclick = () => { firm = inp.value.trim(); finish(true); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); firm = inp.value.trim(); finish(true); } });
      setTimeout(() => inp.focus(), 250);
    };
    step1();
  });

  /* Eski sürümlerin yüklediği örnek veriler cihazda duruyorsa kaldırmayı öner */
  W.offerDemoCleanup = () => {
    if (!SS.store.hasDemo()) return;
    ui.sheet({
      title: 'Örnek veriler bulundu', cls: 'small', noFocus: true, onClose: () => { SS.cfg.demoAsked = true; SS.store.save(); },
      body: `<p class="confirm-p">Önceki sürümden kalan <b>örnek şantiye verileri</b> (Sakarya Vadi Konutları vb.) bu cihazda duruyor. Artık örnek veri kullanılmıyor; kaldırıp kendi şantiyenizle temiz başlayabilirsiniz.<br><br><span class="muted">Yalnızca örnek şantiyelere ait kayıtlar silinir; kendi eklediğiniz şantiyelere dokunulmaz. Ayarlar'dan da yapabilirsiniz.</span></p>`,
      footer: `<button class="btn ghost" data-sheet-close>Şimdilik kalsın</button><button class="btn primary" id="wlClean">${ui.icon('trash')}Örnek verileri kaldır</button>`,
      mount(el, api) { el.parentElement.querySelector('#wlClean').addEventListener('click', () => { SS.store.removeDemo(); api.close(); ui.fillProjSel(); ui.shell(); ui.route('quiet'); ui.toast('Örnek veriler kaldırıldı'); }); },
    });
  };
})();
