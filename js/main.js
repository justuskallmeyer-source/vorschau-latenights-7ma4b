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

  /* Nachtleiste: 20 bis 5 Uhr, Münchner Zeit */
  const OEFFNET = 20, DAUER = 9 * 60;
  const zeitMuenchen = () => {
    const t = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    return { h: +t.find(p => p.type === 'hour').value, m: +t.find(p => p.type === 'minute').value };
  };
  const dauerText = min => {
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return `${h} Std. ${m} Min.`;
    return h ? `${h} Std.` : `${m} Min.`;
  };
  const nacht = $('[data-nacht]'), nachtText = $('[data-nacht-text]'), fuell = $('[data-nacht-fuell]'), marke = $('[data-nacht-marke]');
  const statusKlein = $('[data-status-klein]');
  const nachtAktualisieren = () => {
    const { h, m } = zeitMuenchen();
    const offen = h >= OEFFNET || h < 5;
    let text, klein;
    if (offen) {
      const seit = (h >= OEFFNET ? (h - OEFFNET) * 60 : (h + 24 - OEFFNET) * 60) + m;
      const rest = DAUER - seit;
      const anteil = seit / DAUER * 100;
      fuell.style.width = anteil + '%';
      marke.style.left = anteil + '%';
      text = rest <= 60 ? `Jetzt offen, letzte Stunde` : `Jetzt offen, noch ${dauerText(rest)}`;
      klein = 'Gerade geöffnet';
    } else {
      fuell.style.width = '0%';
      const bis = (OEFFNET - h) * 60 - m;
      text = bis <= 60 ? `Öffnet in ${dauerText(bis)}` : `Heute ab 20 Uhr geöffnet`;
      klein = `Öffnet heute um 20 Uhr`;
    }
    nachtText.textContent = text;
    nacht.classList.toggle('ist-offen', offen);
    if (statusKlein) { statusKlein.textContent = klein; statusKlein.classList.toggle('ist-offen', offen); }
  };
  nachtAktualisieren();
  setInterval(nachtAktualisieren, 30000);
  const nachtHoehe = () => document.documentElement.style.setProperty('--nacht-hoehe', nacht.offsetHeight + 'px');
  nachtHoehe();
  addEventListener('resize', nachtHoehe);

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

  const text1 = $('[data-text1]'), text2 = $('[data-text2]');
  if (window.gsap && window.ScrollTrigger && !ruhig) {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
    });
    tl.to(text1, { autoAlpha: 0, y: -40, duration: 0.14 }, 0.04)
      .fromTo(aussenImg, { scale: 1 }, { scale: 5.2, duration: 0.56, ease: 'power2.in' }, 0.04)
      .to('[data-dunkel]', { opacity: 0.85, duration: 0.12 }, 0.44)
      .fromTo('[data-innen]', { opacity: 0 }, { opacity: 1, duration: 0.14 }, 0.52)
      .fromTo('[data-innen] img', { scale: 1.28 }, { scale: 1, duration: 0.44, ease: 'power1.out' }, 0.52)
      .to('[data-dunkel]', { opacity: 0, duration: 0.14 }, 0.56)
      .fromTo(text2, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.74)
      .to({}, { duration: 0.1 }, 0.9);
    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    text1.style.opacity = 1;
  }

  /* Schild: Schriftzug geht beim ersten Sichtkontakt flackernd an */
  const schild = $('[data-schild]');
  if (schild && !ruhig && 'IntersectionObserver' in window) {
    schild.classList.add('ist-aus');
    const io = new IntersectionObserver(eintraege => {
      if (eintraege[0].isIntersecting) {
        schild.classList.remove('ist-aus');
        schild.classList.add('flackert');
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(schild);
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
