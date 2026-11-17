/* Şantiye Şefi — Web Audio API ile yumuşak, minnoş arayüz sesleri (harici dosya yok)
   Tüm sesler sinüs dalgası, yavaş atak, alçak geçiren filtre ve çok düşük ses seviyesiyle üretilir:
   sert / tiz bir ton yok; baloncuk ve müzik kutusu benzeri tatlı tıngırtılar. */
(function () {
  const SS = window.SS;
  let ctx = null, master = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.4; // tizliği al
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -28; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.75;
    master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    return ctx;
  }
  const enabled = () => SS.store && SS.store.data && SS.cfg.sound && init();

  /* yumuşak zarflı tek nota: yavaş atak, uzun ve pürüzsüz sönüm */
  function note(freq, t0, dur, vol, opts = {}) {
    const { attack = 0.018, glideFrom = 0, harm = 0.16 } = opts;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(master);
    const o = ctx.createOscillator(); o.type = 'sine';
    if (glideFrom) { o.frequency.setValueAtTime(glideFrom, t0); o.frequency.exponentialRampToValueAtTime(freq, t0 + Math.min(0.06, dur / 2)); } else o.frequency.setValueAtTime(freq, t0);
    o.connect(g); o.start(t0); o.stop(t0 + dur + 0.05);
    if (harm) { // oktav üstünde çok hafif bir parlaklık: müzik kutusu gibi
      const h = ctx.createOscillator(), hg = ctx.createGain(); h.type = 'sine'; h.frequency.setValueAtTime(freq * 2, t0);
      hg.gain.setValueAtTime(0.0001, t0); hg.gain.linearRampToValueAtTime(vol * harm, t0 + attack); hg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.6);
      h.connect(hg); hg.connect(master); h.start(t0); h.stop(t0 + dur + 0.05);
    }
  }

  SS.sound = {
    /* minik baloncuk "pıt" — dokunma geri bildirimi */
    click() {
      if (!enabled()) return; const t = ctx.currentTime;
      note(520, t, 0.07, 0.03, { attack: 0.008, glideFrom: 360, harm: 0 });
    },
    /* kayıt / rapor tamam: iki notalı müzik kutusu "tıng-tıng" */
    ok() {
      if (!enabled()) return; const t = ctx.currentTime;
      note(784, t, 0.32, 0.05, { glideFrom: 740 }); // sol
      note(1047, t + 0.11, 0.42, 0.045);             // do (tatlı yükseliş)
    },
    /* uyarı: sert bip yerine yumuşak, aşağı inen "bılop" */
    warn() {
      if (!enabled()) return; const t = ctx.currentTime;
      note(392, t, 0.26, 0.05, { glideFrom: 440, harm: 0.06 });
      note(330, t + 0.15, 0.34, 0.045, { harm: 0.06 });
    },
    /* panel/çekmece açılışı: daha da hafif baloncuk */
    pop() {
      if (!enabled()) return; const t = ctx.currentTime;
      note(600, t, 0.09, 0.02, { attack: 0.01, glideFrom: 420, harm: 0 });
    },
    toggle(on) {
      SS.cfg.sound = on; SS.store.save();
      if (on) { init(); this.ok(); }
    },
    unlock() { init(); },
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { if (SS.store.data && SS.cfg.sound) init(); }, { once: true, passive: true }));
})();
