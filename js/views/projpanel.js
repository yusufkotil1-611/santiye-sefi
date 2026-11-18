/* Şantiye seçim paneli — üst çubuktaki düğme + açılır panel (ilerleme, bütçe, uyarı, hava durumu özetiyle) */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc, N = U.norm, G = SS.charts;

  SS.css(`
  .proj-btn{display:flex;align-items:center;gap:10px;height:44px;padding:0 10px 0 6px;background:var(--surface);border:1px solid var(--line);border-radius:14px;cursor:pointer;max-width:300px;color:var(--ink);text-align:left;transition:border-color .15s,box-shadow .15s}
  .proj-btn:hover,.proj-btn[aria-expanded=true]{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 14%,transparent)}
  .pb-ic{width:32px;height:32px;border-radius:10px;background:var(--brand-soft);color:var(--brand-text);display:grid;place-items:center;flex:none;position:relative}.pb-ic .ic{width:18px;height:18px}
  .pb-st{position:absolute;right:-2px;bottom:-2px;width:10px;height:10px;border-radius:50%;border:2px solid var(--surface);background:var(--brand)}.pb-st.active{background:var(--ok)}.pb-st.planned{background:var(--info)}.pb-st.done{background:var(--muted)}
  .pb-t{min-width:0}.pb-t small{display:block;font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em;line-height:1.1}.pb-t b{display:block;font-size:14px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.25}
  .proj-btn>.ic{width:16px;height:16px;color:var(--muted);flex:none}
  .layer:has(.sheet.projpanel){align-items:flex-start;justify-content:flex-start}
  .sheet.projpanel{width:min(440px,calc(100vw - 24px));max-height:min(84vh,720px);margin:62px 0 0 12px}
  .sheet.projpanel .sheet-b{padding:12px 12px 6px;display:flex;flex-direction:column;gap:10px}
  .pp-search{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border:1.5px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--muted)}.pp-search:focus-within{border-color:var(--brand);color:var(--brand)}.pp-search input{flex:1;border:0;background:none;outline:none;font:inherit;color:var(--ink);min-width:0}
  .pp-g{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:6px 4px -2px}
  .pp-all,.pp-card{display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:12px;border-radius:16px;border:1.5px solid var(--line);background:var(--surface);cursor:pointer;color:var(--ink);transition:border-color .15s,transform .15s var(--ease),background .15s}
  .pp-all:hover,.pp-card:hover{border-color:color-mix(in srgb,var(--brand) 55%,var(--line));transform:translateY(-1px)}.pp-all.on,.pp-card.on{border-color:var(--brand);background:var(--brand-soft)}
  .pp-all .kpi-ic{margin:0;flex:none;width:44px;height:44px;border-radius:14px}
  .pp-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}.pp-top{display:flex;align-items:center;gap:8px;min-width:0}.pp-top b{font-size:14.5px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  .pp-loc{color:var(--muted);font-size:12.5px;display:flex;align-items:center;gap:4px;min-width:0}.pp-loc .ic{width:13px;height:13px;flex:none}.pp-loc span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pp-bar{position:relative;height:7px;border-radius:99px;background:var(--track);overflow:visible}.pp-bar i{display:block;height:100%;border-radius:99px;background:var(--brand)}.pp-bar .pmark{position:absolute;top:-3px;bottom:-3px;width:3px;background:var(--ink);border-radius:2px;opacity:.7}
  .pp-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.pp-meta .badge{font-size:11.5px;padding:2px 8px}.pp-meta .badge .ic{width:12px;height:12px}
  .pp-all .pp-loc span{white-space:normal;overflow:visible}
  .pp-ring{flex:none;position:relative}.pp-ring .ring-l b{font-size:12px}
  .pp-ck{width:22px;height:22px;border-radius:50%;background:var(--brand);color:var(--brand-ink);display:grid;place-items:center;flex:none}.pp-ck .ic{width:14px;height:14px;stroke-width:3}
  .sheet.projpanel .sheet-f{justify-content:space-between}
  @media(max-width:699px){
    .proj-btn{max-width:150px;padding:0 6px 0 4px;height:40px;gap:7px}.pb-t small{display:none}.pb-t b{max-width:78px;font-size:13px}.pb-ic{width:28px;height:28px}.proj-btn>.ic{display:none}
    .layer:has(.sheet.projpanel){align-items:flex-end}.sheet.projpanel{width:100%;margin:0;max-height:88vh}
  }
  `);

  const ST = { active: ['Aktif', 'ok'], planned: ['Planlanan', 'info'], done: ['Tamamlandı', 'muted'] };
  const scoped = (pid, fn) => { const old = SS.cfg.activeProject; SS.cfg.activeProject = pid; try { return fn(); } finally { SS.cfg.activeProject = old; } };

  /* ---------- üst çubuk düğmesi ---------- */
  ui.fillProjSel = function () {
    if (!SS.D.projects.find((p) => p.id === SS.cfg.activeProject)) SS.cfg.activeProject = 'all';
    const name = document.getElementById('projBtnName'), btn = document.getElementById('projBtn'); if (!name || !btn) return;
    const p = SS.D.projects.find((x) => x.id === SS.cfg.activeProject);
    name.textContent = p ? p.shortName || p.name : SS.D.projects.length ? 'Tüm Şantiyeler' : 'Şantiye ekle';
    const dot = btn.querySelector('.pb-st'); if (dot) dot.className = 'pb-st ' + (p ? p.status : '');
    btn.title = p ? p.name : 'Şantiye seç';
  };

  /* ---------- panel ---------- */
  function info(p) {
    const pg = C.progress(p), pl = C.planned(p), sp = C.spent(p.id), left = U.diff(U.today(), p.end);
    const al = scoped(p.id, () => C.alerts().filter((a) => a.level !== 'info')), bad = al.some((a) => a.level === 'bad');
    return { p, pg, pl, spPct: p.totalBudget ? (sp / p.totalBudget) * 100 : 0, left, al: al.length, bad, wx: SS.wx ? SS.wx.brief(p.id) : null };
  }
  const card = (x, cur) => {
    const { p } = x, s = ST[p.status] || ST.active, behind = p.status === 'active' && x.pg - x.pl < -5;
    return `<button class="pp-card ${cur === p.id ? 'on' : ''}" data-pick="${p.id}" data-q="${esc(N(p.name + ' ' + (p.location || '') + ' ' + (p.shortName || '')))}">
      <span class="pp-ring">${G.ring(x.pg, { size: 50, stroke: 6, tone: p.status === 'done' ? 'var(--muted)' : 'var(--brand)' })}</span>
      <span class="pp-main"><span class="pp-top"><b>${esc(p.shortName || p.name)}</b><span class="badge ${s[1]}">${s[0]}</span></span>
        ${p.location ? `<span class="pp-loc">${I('pin')}<span>${esc(p.location)}</span></span>` : ''}
        <span class="pp-bar" title="Gerçekleşen %${U.num(x.pg)} · planlanan %${U.num(x.pl)}"><i style="width:${U.clamp(x.pg, 0, 100)}%"></i>${p.status === 'active' ? `<span class="pmark" style="left:calc(${U.clamp(x.pl, 0, 100)}% - 1px)"></span>` : ''}</span>
        <span class="pp-meta"><span class="badge muted">${I('wallet')}${U.compact(p.totalBudget || 0)} · %${U.num(x.spPct)}</span>${p.status === 'active' ? `<span class="badge ${x.left < 0 ? 'bad' : 'muted'}">${I('calendar')}${x.left < 0 ? -x.left + ' gün gecikti' : x.left + ' gün kaldı'}</span>` : ''}${behind ? `<span class="badge warn">${I('clock')}%${U.num(x.pl - x.pg)} geride</span>` : ''}${x.al ? `<span class="badge ${x.bad ? 'bad' : 'warn'}">${I('bell')}${x.al} uyarı</span>` : ''}${x.wx ? `<span class="badge info" title="${esc(x.wx.label)}">${I(x.wx.icon)}${x.wx.temp}°</span>` : ''}</span></span>
      ${cur === p.id ? `<span class="pp-ck">${I('check')}</span>` : ''}</button>`;
  };

  function open() {
    const cur = SS.cfg.activeProject, ps = SS.D.projects;
    if (!ps.length) { SS.actions['proj.new'](); return; }
    const infos = ps.map(info), act = infos.filter((x) => x.p.status === 'active'), avg = act.length ? U.sum(act, (x) => x.pg) / act.length : 0, totAl = U.sum(infos, (x) => x.al);
    const groups = ['active', 'planned', 'done'].map((k) => [k, infos.filter((x) => x.p.status === k)]).filter(([, l]) => l.length), btn = document.getElementById('projBtn');
    const body = `${ps.length > 4 ? `<label class="pp-search">${I('search')}<input type="search" placeholder="Şantiye ara…" autocomplete="off" aria-label="Şantiye ara"></label>` : ''}
      <button class="pp-all ${cur === 'all' ? 'on' : ''}" data-pick="all" data-q="tum santiyeler"><span class="kpi-ic tone-brand">${I('grid')}</span><span class="pp-main"><span class="pp-top"><b>Tüm Şantiyeler</b></span><span class="pp-loc"><span>${act.length} aktif · ort. ilerleme %${U.num(avg)} · ${U.compact(U.sum(ps, (p) => p.totalBudget || 0))} toplam bütçe${totAl ? ` · ${totAl} uyarı` : ''}</span></span></span>${cur === 'all' ? `<span class="pp-ck">${I('check')}</span>` : ''}</button>
      ${groups.map(([k, l]) => `${groups.length > 1 ? `<div class="pp-g" data-g>${ST[k][0]} · ${l.length}</div>` : ''}${l.map((x) => card(x, cur)).join('')}`).join('')}
      <div class="empty small" data-none style="display:none;padding:18px"><p>Eşleşen şantiye yok</p></div>`;
    ui.sheet({ title: 'Şantiye Seç', cls: 'projpanel', noFocus: true, body,
      footer: `<button class="btn" data-action="proj.new" data-sheet-close>${I('plus')}Yeni şantiye</button><a class="btn ghost" href="#/projects" data-sheet-close>Tüm projeler ${I('chevR')}</a>`,
      onClose: () => { if (btn) btn.setAttribute('aria-expanded', 'false'); },
      mount(el, api) {
        if (btn) { btn.setAttribute('aria-expanded', 'true'); if (matchMedia('(min-width:700px)').matches) { const r = btn.getBoundingClientRect(), w = Math.min(440, innerWidth - 24); api.sheet.style.margin = `${Math.round(r.bottom + 8)}px 0 0 ${Math.round(Math.max(12, Math.min(r.left, innerWidth - w - 12)))}px`; } }
        const items = () => [...el.querySelectorAll('[data-pick]')].filter((b) => b.style.display !== 'none');
        el.addEventListener('click', (e) => {
          const b = e.target.closest('[data-pick]'); if (!b) return; const id = b.dataset.pick; api.close();
          if (id !== SS.cfg.activeProject) { SS.cfg.activeProject = id; SS.store.save(); ui.fillProjSel(); ui.rerender(); ui.toast(id === 'all' ? 'Tüm şantiyeler gösteriliyor' : 'Şantiye seçildi: ' + esc(ui.projectName(id)), 'info'); }
        });
        const inp = el.querySelector('.pp-search input');
        if (inp) { inp.addEventListener('input', () => { const q = N(inp.value); let n = 0; items().concat([...el.querySelectorAll('[data-pick]')]).forEach((b) => { const ok = !q || b.dataset.q.includes(q); b.style.display = ok ? '' : 'none'; if (ok) n++; }); el.querySelector('[data-none]').style.display = n ? 'none' : ''; el.querySelectorAll('[data-g]').forEach((g) => (g.style.display = q ? 'none' : '')); }); if (matchMedia('(pointer:fine)').matches) setTimeout(() => inp.focus(), 120); }
        el.addEventListener('keydown', (e) => { if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; const l = items(), i = l.indexOf(document.activeElement); e.preventDefault(); (l[(i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length] || l[0]).focus(); });
        if (!inp) { const on = el.querySelector('.on'); if (on && matchMedia('(pointer:fine)').matches) setTimeout(() => on.focus({ preventScroll: true }), 120); }
      } });
  }
  SS.actions['proj.panel'] = open;
})();
