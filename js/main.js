/* Late Nights: Hero, Nachtleiste, Schild, Anfrage-Planer, Bildansicht */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Kopfzeile dunkel, sobald der Hero verlassen ist; Menü auf dem Handy */
  const kopf = $('[data-kopf]');
  const hero = $('[data-hero]');
  const kopfPruefen = () => {
    const grenze = hero ? hero.offsetHeight - innerHeight * 1.05 : 40;
    kopf.classList.toggle('ist-dunkel', scrollY > Math.max(40, grenze));
  };
  addEventListener('scroll', kopfPruefen, { passive: true });
  addEventListener('resize', kopfPruefen);
  kopfPruefen();

  const menueKnopf = $('[data-menue]'), navi = $('#navi');
  const menue = auf => {
    menueKnopf.setAttribute('aria-expanded', auf);
    navi.classList.toggle('ist-offen', auf);
    document.body.classList.toggle('menue-offen', auf);
    menueKnopf.querySelector('.menue-text').textContent = auf ? 'Schließen' : 'Menü';
  };
  menueKnopf.addEventListener('click', () => menue(menueKnopf.getAttribute('aria-expanded') !== 'true'));
  $$('a', navi).forEach(a => a.addEventListener('click', () => menue(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') menue(false); });

  /* Öffnungsstatus nach Münchner Zeit, geöffnet 20 bis 5 Uhr */
  const statusFelder = $$('[data-status]');
  const statusAktualisieren = () => {
    const t = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const h = +t.find(p => p.type === 'hour').value;
    const text = (h >= 20 || h < 5) ? 'jetzt geöffnet' : 'heute ab 20 Uhr';
    statusFelder.forEach(el => { el.textContent = text; });
  };
  statusAktualisieren();
  setInterval(statusAktualisieren, 60000);
  const leiste = $('[data-leiste]');
  const leisteHoehe = () => document.documentElement.style.setProperty('--leiste-hoehe', leiste.offsetHeight + 'px');
  leisteHoehe();
  addEventListener('resize', leisteHoehe);

  /* Hero: Kamera fährt durch die offene Tür an die Theke */
  const TUER = { quer: [0.36, 0.63], hoch: [0.28, 0.57] };
  const aussenImg = $('[data-aussen] img');
  const tuerAnsetzen = () => {
    const W = innerWidth, H = aussenImg.clientHeight;
    const hoch = (aussenImg.currentSrc || aussenImg.src).includes('-hoch');
    const iw = aussenImg.naturalWidth || (hoch ? 2662 : 4000), ih = aussenImg.naturalHeight || (hoch ? 4000 : 2662);
    const s = Math.max(W / iw, H / ih);
    const [u, v] = hoch ? TUER.hoch : TUER.quer;
    const x = (W - iw * s) / 2 + u * iw * s, y = (H - ih * s) / 2 + v * ih * s;
    aussenImg.style.transformOrigin = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  };
  aussenImg.addEventListener('load', tuerAnsetzen);
  addEventListener('resize', tuerAnsetzen);
  tuerAnsetzen();

  const text1 = $('[data-text1]');
  if (window.gsap && window.ScrollTrigger && !ruhig) {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
    });
    tl.to(text1, { autoAlpha: 0, duration: 0.15 }, 0.05)
      .fromTo(aussenImg, { scale: 1 }, { scale: 2.6, duration: 0.6, ease: 'power1.in' }, 0.05)
      .to('[data-dunkel]', { opacity: 0.7, duration: 0.15 }, 0.45)
      .fromTo('[data-innen]', { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.55)
      .fromTo('[data-innen] img', { scale: 1.12 }, { scale: 1, duration: 0.4 }, 0.55)
      .to('[data-dunkel]', { opacity: 0, duration: 0.15 }, 0.6)
      .to({}, { duration: 0.05 }, 0.95);
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* Anfrage-Planer */
  const planer = $('[data-planer]');
  if (planer) {
    const ausgabe = $('[data-nachricht]'), wa = $('[data-whatsapp]'), kopieren = $('[data-kopieren]');
    const datumFeld = $('#p-datum'), datumHinweis = $('[data-datum-hinweis]'), gaesteFeld = $('#p-gaeste');
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    datumFeld.min = iso(heute);
    const datumLang = wert => {
      if (!wert) return '';
      const [j, mo, t] = wert.split('-').map(Number);
      return new Date(j, mo - 1, t).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };
    const bauen = () => {
      const f = new FormData(planer);
      const anlass = f.get('anlass'), datum = f.get('datum'), beginn = f.get('beginn');
      const gaeste = Math.max(1, parseInt(f.get('gaeste'), 10) || 0);
      const name = (f.get('name') || '').trim(), firma = (f.get('firma') || '').trim(), wuensche = (f.get('wuensche') || '').trim();
      let vergangen = false;
      if (datum) { const [j, mo, t] = datum.split('-').map(Number); vergangen = new Date(j, mo - 1, t) < heute; }
      datumHinweis.textContent = vergangen ? 'Das Datum liegt in der Vergangenheit.' : '';
      const artikel = anlass.endsWith('abschied') ? 'einen' : 'eine';
      const satz = `wir planen ${artikel} ${anlass} im Late Nights`;
      const teile = [];
      teile.push(datum ? `am ${datumLang(datum)}` : 'Datum noch offen');
      if (beginn) teile.push(`ab ${beginn}`);
      teile.push(`mit etwa ${gaeste} Gästen`);
      let text = `Hallo Late Nights,\n\n${satz}: ${teile.join(', ')}. Wir hätten gern ${f.get('bereich')}.`;
      if (firma) text += `\nFirma: ${firma}`;
      if (wuensche) text += `\n\nWünsche: ${wuensche}`;
      text += `\n\nIst das möglich? Ich freue mich auf eure Rückmeldung.\n\nViele Grüße${name ? '\n' + name : ''}`;
      ausgabe.textContent = text;
      wa.href = 'https://wa.me/491779278497?text=' + encodeURIComponent(text);
      return text;
    };
    planer.addEventListener('input', bauen);
    planer.addEventListener('change', bauen);
    planer.addEventListener('submit', e => e.preventDefault());
    $$('[data-schritt]', planer).forEach(b => b.addEventListener('click', () => {
      const n = (parseInt(gaesteFeld.value, 10) || 0) + parseInt(b.dataset.schritt, 10);
      gaesteFeld.value = Math.min(500, Math.max(5, n));
      bauen();
    }));
    kopieren.addEventListener('click', async () => {
      const text = bauen();
      try { await navigator.clipboard.writeText(text); kopieren.textContent = 'Kopiert'; }
      catch { kopieren.textContent = 'Bitte von Hand markieren'; }
      setTimeout(() => { kopieren.textContent = 'Text kopieren'; }, 2200);
    });
    bauen();
  }

  /* Bildansicht für die Galerie */
  const lk = $('[data-leuchtkasten]');
  const kacheln = $$('[data-galerie] a');
  if (lk && kacheln.length && typeof lk.showModal === 'function') {
    const bild = $('[data-lk-bild]'), unter = $('[data-lk-text]');
    let i = 0;
    const zeigen = n => {
      i = (n + kacheln.length) % kacheln.length;
      const img = $('img', kacheln[i]);
      bild.src = kacheln[i].href; bild.alt = img.alt; unter.textContent = img.alt;
    };
    kacheln.forEach((k, n) => k.addEventListener('click', e => { e.preventDefault(); zeigen(n); lk.showModal(); }));
    $('[data-lk-zu]').addEventListener('click', () => lk.close());
    $('[data-lk-vor]').addEventListener('click', () => zeigen(i + 1));
    $('[data-lk-zurueck]').addEventListener('click', () => zeigen(i - 1));
    lk.addEventListener('click', e => { if (e.target === lk) lk.close(); });
    lk.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') zeigen(i + 1);
      if (e.key === 'ArrowLeft') zeigen(i - 1);
    });
    let startX = null;
    lk.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    lk.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) zeigen(i + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }
})();
