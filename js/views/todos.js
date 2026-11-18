/* Görevler & Toplantı Tutanakları — hızlı görev ekleme, gecikme takibi, toplantıdan göreve dönüştürme */
(function () {
  const SS = window.SS, U = SS.U, C = SS.calc, ui = SS.ui, I = ui.icon, esc = U.esc;
  const PRI = { Düşük: 'muted', Orta: 'info', Yüksek: 'warn', Kritik: 'bad' };

  SS.css(`
  .qadd{display:flex;gap:8px;flex-wrap:wrap;padding:12px;align-items:center}.qadd input[type=text]{flex:1;min-width:220px;min-height:46px;border:1.5px solid var(--line);border-radius:12px;padding:0 14px;background:var(--surface-2);font:inherit;color:var(--ink);outline:none}
  .qadd input[type=text]:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)}
  .tgroup{display:flex;flex-direction:column;gap:2px}.tgroup>h4{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:6px 4px 4px;display:flex;gap:8px;align-items:center}
  .todo{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;background:var(--surface);border:1px solid var(--line);cursor:pointer;transition:border-color .15s,transform .15s}.todo:hover{border-color:var(--brand)}
  .todo.done{opacity:.6}.todo.done .tt{text-decoration:line-through}
  .tick-b{width:26px;height:26px;border-radius:50%;border:2px solid var(--line);background:var(--surface);display:grid;place-items:center;flex:none;cursor:pointer;color:transparent;transition:all .15s}.tick-b:hover{border-color:var(--ok)}.todo.done .tick-b{background:var(--ok);border-color:var(--ok);color:#fff}.tick-b .ic{width:15px;height:15px;stroke-width:3}
  .todo .tt{font-weight:600;line-height:1.3}.todo .ts{color:var(--muted);font-size:12.5px;display:flex;gap:10px;flex-wrap:wrap;margin-top:2px}.todo .grow{min-width:0}
  .mcard{padding:16px;display:flex;flex-direction:column;gap:8px;cursor:pointer}.mcard h3{font-size:16px}.mcard p{color:var(--muted);font-size:13.5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  `);

  const vis = () => SS.D.todos.filter((t) => C.active() === 'all' || !t.projectId || t.projectId === C.active());
  const group = (t) => { const d = U.today(); if (t.status === 'Bitti') return 'done'; if (!t.due) return 'none'; if (t.due < d) return 'late'; if (t.due === d) return 'today'; if (t.due <= U.addDays(d, 7)) return 'week'; return 'later'; };
  const GL = { late: ['Geciken', 'bad'], today: ['Bugün', 'brand'], week: ['Bu hafta', 'info'], later: ['Daha sonra', 'muted'], none: ['Tarihsiz', 'muted'], done: ['Tamamlanan', 'ok'] };

  function todoRow(t) {
    const d = t.due ? U.diff(U.today(), t.due) : null, done = t.status === 'Bitti';
    return `<div class="todo ${done ? 'done' : ''}" data-action="todo.edit" data-id="${t.id}"><button class="tick-b" data-action="todo.toggle" data-id="${t.id}" aria-label="${done ? 'Geri aç' : 'Tamamla'}">${I('check')}</button>
      <div class="grow"><div class="tt">${esc(t.title)}</div><div class="ts">${t.due ? `<span class="${!done && d < 0 ? 'neg' : ''}">${I('calendar')} ${U.fmtDate(t.due)}${!done && d < 0 ? ` · ${-d} gün gecikti` : d === 0 ? ' · bugün' : d === 1 ? ' · yarın' : ''}</span>` : ''}${t.projectId ? `<span>${esc(ui.projectName(t.projectId))}</span>` : ''}${t.assignee ? `<span>${I('user')} ${esc(t.assignee)}</span>` : ''}${t.meetingId ? `<span class="badge muted">toplantı</span>` : ''}</div></div>${ui.badge(t.priority || 'Orta', PRI[t.priority || 'Orta'])}</div>`;
  }
  function tasksBody() {
    const list = vis(), st = ui.vs('todos', { showDone: false });
    if (!list.length) return `<div class="card pad">${ui.empty('check', 'Görev listeniz boş', 'Yukarıdaki kutuya bir iş yazıp Enter\'a basın; ya da Şantiye AI\'ya “yarın için görev ekle: …” deyin.')}</div>`;
    const by = U.groupBy(list.slice().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || ['Kritik', 'Yüksek', 'Orta', 'Düşük'].indexOf(a.priority) - ['Kritik', 'Yüksek', 'Orta', 'Düşük'].indexOf(b.priority)), group);
    return ['late', 'today', 'week', 'later', 'none'].filter((k) => by[k]).map((k) => `<div class="tgroup"><h4>${ui.badge(GL[k][0], GL[k][1])}<span>${by[k].length}</span></h4>${by[k].map(todoRow).join('')}</div>`).join('')
      + (by.done ? `<div class="tgroup"><h4><button class="btn sm ghost" data-action="todo.showdone">${I(st.showDone ? 'chevU' : 'chevD')}Tamamlanan (${by.done.length})</button></h4>${st.showDone ? by.done.slice(-15).reverse().map(todoRow).join('') : ''}</div>` : '');
  }

  function meetBody() {
    const list = SS.D.meetings.filter((m) => C.active() === 'all' || !m.projectId || m.projectId === C.active()).sort((a, b) => b.date.localeCompare(a.date));
    if (!list.length) return `<div class="card pad">${ui.empty('note', 'Toplantı tutanağı yok', 'Şantiye toplantılarının kararlarını kaydedin; aksiyonları tek dokunuşla göreve dönüştürün ve PDF olarak paylaşın.', `<button class="btn primary" data-action="meet.new">${I('plus')}Tutanak Yaz</button>`)}</div>`;
    return `<div class="mgrid">${list.map((m) => `<article class="card mcard link" data-action="meet.edit" data-id="${m.id}"><div class="row between"><span class="badge info">${U.fmtDate(m.date)}</span>${m.projectId ? `<span class="sub">${esc(ui.projectName(m.projectId))}</span>` : ''}</div><h3>${esc(m.title)}</h3><p>${esc(m.notes || m.agenda || '')}</p><div class="row"><span class="sub">${I('users')} ${(m.attendees || '').split('\n').filter(Boolean).length} katılımcı</span><span class="grow"></span><button class="btn sm ghost" data-action="meet.print" data-id="${m.id}">${I('printer')}PDF</button><button class="btn sm ghost" data-action="meet.share" data-id="${m.id}" aria-label="Paylaş">${I('send')}</button></div></article>`).join('')}</div>`;
  }

  SS.views.todos = {
    title: 'Görevler',
    render() {
      const st = ui.vs('todos', { tab: 'tasks', showDone: false }), all = vis(), open = all.filter(C.todoOpen), d = U.today();
      const kpis = `<div class="grid g-4 kpis">${ui.kpi({ label: 'Açık görev', value: open.length, fmt: 'num', icon: 'list', tone: 'info', sub: 'tamamlanmayı bekleyen' })}${ui.kpi({ label: 'Bugün', value: open.filter((t) => t.due === d).length, fmt: 'num', icon: 'calendar', tone: 'brand', sub: 'bugün bitmesi gereken' })}${ui.kpi({ label: 'Geciken', value: open.filter((t) => t.due && t.due < d).length, fmt: 'num', icon: 'alert', tone: open.some((t) => t.due && t.due < d) ? 'bad' : 'ok', sub: 'tarihi geçmiş' })}${ui.kpi({ label: 'Bu hafta bitti', value: all.filter((t) => t.status === 'Bitti' && t.done && t.done >= U.addDays(d, -6)).length, fmt: 'num', icon: 'check', tone: 'ok', sub: 'son 7 günde tamamlanan' })}</div>`;
      const add = `<form class="card qadd" data-todo-form autocomplete="off"><input type="text" name="t" maxlength="200" placeholder="Yeni görev… (ör. cuma betonu için pompa ayarla)" aria-label="Yeni görev"><select class="select" name="d" aria-label="Tarih"><option value="">Tarihsiz</option><option value="0" selected>Bugün</option><option value="1">Yarın</option><option value="3">3 gün sonra</option><option value="7">1 hafta sonra</option></select><button class="btn primary" type="submit">${I('plus')}Ekle</button></form>`;
      return `<div class="page">${ui.head({ title: 'Görevler & Toplantılar', sub: 'Yapılacak işler, hatırlatmalar ve toplantı tutanakları', actions: st.tab === 'meet' ? `<button class="btn primary" data-action="meet.new">${I('plus')}Tutanak Yaz</button>` : `${SS.exp.menu('todos')}<button class="btn primary" data-action="todo.new">${I('plus')}Ayrıntılı Görev</button>` })}
        ${ui.tabs('todos', 'tab', [['tasks', 'Görevler', open.length], ['meet', 'Toplantı Tutanakları', SS.D.meetings.length]], st.tab)}
        ${st.tab === 'meet' ? meetBody() : kpis + add + `<div class="stack">${tasksBody()}</div>`}</div>`;
    },
  };

  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-todo-form]'); if (!f) return; e.preventDefault();
    const t = f.elements.t.value.trim(); if (!t) { f.elements.t.focus(); return; }
    const dd = f.elements.d.value, p = C.active() !== 'all' ? C.active() : '';
    SS.store.add('todos', { projectId: p, title: t, due: dd === '' ? '' : U.addDays(U.today(), +dd), priority: 'Orta', status: 'Açık', created: U.today(), note: '', assignee: '' }, 'k');
    ui.rerender(); SS.sound.ok(); setTimeout(() => { const i = document.querySelector('[data-todo-form] input[name=t]'); if (i) i.focus(); }, 30);
  });
  SS.actions['todo.toggle'] = (el, ev) => { ev && ev.stopPropagation(); const t = SS.store.find('todos', el.dataset.id); if (!t) return; const done = t.status !== 'Bitti'; SS.store.upd('todos', t.id, { status: done ? 'Bitti' : 'Açık', done: done ? U.today() : '' }); ui.rerender(); if (done) SS.sound.ok(); };
  SS.actions['todo.showdone'] = () => { const s = ui.vs('todos'); s.showDone = !s.showDone; ui.rerender(); };

  function todoForm(t) {
    const e = !!t;
    ui.form({ title: e ? 'Görevi Düzenle' : 'Yeni Görev', values: e ? t : { priority: 'Orta', due: U.today(), projectId: C.active() !== 'all' ? C.active() : '' }, cls: '',
      fields: [{ name: 'title', label: 'Görev', required: true }, { name: 'projectId', label: 'Şantiye', type: 'select', options: [['', 'Genel'], ...ui.projOpts()], half: true }, { name: 'due', label: 'Tarih', type: 'date' }, { name: 'priority', label: 'Öncelik', type: 'select', options: SS.C.priorities }, { name: 'assignee', label: 'Sorumlu', half: true }, { name: 'note', label: 'Not', type: 'textarea', rows: 2 }, ...(e ? [{ name: 'status', label: 'Durum', type: 'select', options: ['Açık', 'Bitti'], half: true }] : [])],
      danger: e ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Görev silinsin mi?', text: esc(t.title) })) { SS.store.del('todos', t.id); a.close(); ui.rerender(); ui.refreshBadges(); } } } : null,
      onSubmit(v) { const d = { title: v.title, projectId: v.projectId, due: v.due, priority: v.priority, assignee: v.assignee, note: v.note }; if (e) { d.status = v.status || t.status; d.done = d.status === 'Bitti' ? t.done || U.today() : ''; SS.store.upd('todos', t.id, d); } else SS.store.add('todos', Object.assign(d, { status: 'Açık', created: U.today() }), 'k'); ui.rerender(); ui.refreshBadges(); ui.toast('Görev kaydedildi'); } });
  }
  SS.actions['todo.new'] = () => todoForm(null);
  SS.actions['todo.edit'] = (el) => todoForm(SS.store.find('todos', el.dataset.id));

  /* ---------- toplantı tutanağı ---------- */
  const meetDef = (m) => ({ title: 'Toplantı Tutanağı', project: m.projectId ? ui.projectName(m.projectId) : 'Genel', meta: [['Toplantı', m.title], ['Tarih', U.fmtDate(m.date)], ['Yer', m.place || '—']], sections: [
    { heading: 'Katılımcılar', cols: [{ h: 'Ad / unvan' }], rows: (m.attendees || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => [x]) },
    ...(m.agenda ? [{ heading: 'Gündem', cols: [{ h: 'Madde' }], rows: m.agenda.split('\n').map((x) => x.trim()).filter(Boolean).map((x) => [x]) }] : []),
    { heading: 'Görüşmeler ve kararlar', cols: [{ h: 'Madde' }], rows: (m.notes || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => [x]) },
    { heading: 'Aksiyonlar', cols: [{ h: 'Görev' }, { h: 'Sorumlu' }, { h: 'Tarih' }], rows: SS.D.todos.filter((t) => t.meetingId === m.id).map((t) => [t.title, t.assignee || '—', t.due ? U.fmtDate(t.due) : '—']) }] });
  const meetText = (m) => `📋 ${m.title} — ${U.fmtDate(m.date)}${m.place ? ' · ' + m.place : ''}\n\n${m.notes || ''}\n\nAksiyonlar:\n${SS.D.todos.filter((t) => t.meetingId === m.id).map((t) => `• ${t.title}${t.assignee ? ' (' + t.assignee + ')' : ''}${t.due ? ' — ' + U.fmtDate(t.due) : ''}`).join('\n') || '—'}`;
  function meetForm(m) {
    const e = !!m;
    ui.form({ title: e ? 'Tutanağı Düzenle' : 'Yeni Toplantı Tutanağı', wide: true, values: e ? m : { date: U.today(), projectId: C.active() !== 'all' ? C.active() : '', attendees: SS.cfg.user || '' },
      fields: [{ name: 'title', label: 'Toplantı konusu', required: true, placeholder: 'ör. Haftalık şantiye koordinasyon toplantısı' }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'projectId', label: 'Şantiye', type: 'select', options: [['', 'Genel'], ...ui.projOpts()] }, { name: 'place', label: 'Yer', half: true },
        { name: 'attendees', label: 'Katılımcılar (her satıra bir kişi)', type: 'textarea', rows: 3 }, { name: 'agenda', label: 'Gündem', type: 'textarea', rows: 2 }, { name: 'notes', label: 'Görüşmeler ve alınan kararlar', type: 'textarea', rows: 5 },
        { name: 'actions', label: 'Aksiyonlar (her satıra bir görev: "Görev — Sorumlu")', type: 'textarea', rows: 3, hint: 'Kaydedince bu satırlar göreve dönüşür (yarın tarihli).' }],
      danger: e ? { label: 'Sil', onClick: async (a) => { if (await ui.confirm({ title: 'Tutanak silinsin mi?', text: esc(m.title) })) { SS.store.del('meetings', m.id); a.close(); ui.rerender(); } } } : null,
      onSubmit(v) {
        const d = { title: v.title, date: v.date, projectId: v.projectId, place: v.place, attendees: v.attendees, agenda: v.agenda, notes: v.notes }; let id;
        if (e) { SS.store.upd('meetings', m.id, d); id = m.id; } else id = SS.store.add('meetings', d, 'mt').id;
        const acts = String(v.actions || '').split('\n').map((x) => x.trim()).filter(Boolean);
        acts.forEach((a) => { const [title, who] = a.split(/\s+[—–-]\s+/); SS.store.add('todos', { projectId: v.projectId, title: title.trim(), assignee: (who || '').trim(), due: U.addDays(v.date > U.today() ? v.date : U.today(), 1), priority: 'Orta', status: 'Açık', created: U.today(), meetingId: id, note: '' }, 'k'); });
        ui.rerender(); ui.refreshBadges(); ui.toast(acts.length ? `Tutanak kaydedildi · ${acts.length} görev oluşturuldu` : 'Tutanak kaydedildi');
      } });
  }
  SS.actions['meet.new'] = () => meetForm(null);
  SS.actions['meet.edit'] = (el) => meetForm(SS.store.find('meetings', el.dataset.id));
  SS.actions['meet.print'] = (el, ev) => { ev && ev.stopPropagation(); SS.exp.print(meetDef(SS.store.find('meetings', el.dataset.id))); };
  SS.actions['meet.share'] = (el, ev) => { ev && ev.stopPropagation(); ui.share(meetText(SS.store.find('meetings', el.dataset.id))); };

  SS.reports.todos = () => { const l = vis().slice().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')); return { title: 'Görev Listesi', project: C.active() === 'all' ? 'Tüm şantiyeler' : ui.projectName(C.active()), meta: [['Açık', String(l.filter(C.todoOpen).length)]], sections: [{ heading: 'Görevler', cols: [{ h: 'Görev' }, { h: 'Şantiye' }, { h: 'Sorumlu' }, { h: 'Tarih' }, { h: 'Öncelik' }, { h: 'Durum' }], rows: l.map((t) => [t.title, t.projectId ? ui.projectName(t.projectId) : 'Genel', t.assignee || '', t.due ? U.fmtDate(t.due) : '', t.priority, t.status]) }] }; };
})();
