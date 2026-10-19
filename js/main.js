/* Mas de la Font des Roches : comportements de la page
   1. en-tête et menu   2. héros   3. apparitions et parallaxe   4. carrousels   5. onglets du gîte   6. visionneuse photos
   7. panneau de réservation (démonstration de l'application de gestion)   8. formulaire de questions */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NB = ' ';

  /* 1. En-tête et menu */
  var barre = $('.bar'), menu = $('#menu'), burger = $('#burger');
  function onScroll() { barre.classList.toggle('plein', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var o = menu.classList.toggle('ouvert'); burger.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('ouvert'); burger.setAttribute('aria-expanded', 'false'); }); });
  if ('IntersectionObserver' in window) {
    var cible = { histoire: 'histoire', frise: 'histoire', chantier: 'histoire', eux: 'histoire', gite: 'gite', activites: 'activites', avis: 'avis', contact: 'contact' };
    var vus = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('#menu a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cible[e.target.id]); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(cible).forEach(function (i) { var s = document.getElementById(i); if (s) vus.observe(s); });
  }

  /* 2. Héros : fonds qui se fondent l'un dans l'autre, avis qui tournent */
  function tourne(liste, classe, delai) {
    if (liste.length < 2 || reduit) return;
    var i = 0;
    setInterval(function () { liste[i].classList.remove(classe); i = (i + 1) % liste.length; liste[i].classList.add(classe); }, delai);
  }
  tourne($$('.hf'), 'on', 3000);
  tourne($$('.hero-avis .q'), 'on', 4000);

  /* 3. Apparitions au défilement et parallaxe des fonds */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduit) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }); }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('vu'); });
  var pxs = $$('[data-px]');
  if (pxs.length && !reduit) {
    var occupe = false;
    var parallaxe = function () {
      occupe = false;
      pxs.forEach(function (p) {
        var r = p.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        p.style.transform = 'translate3d(0,' + Math.round(-(r.top + r.height / 2 - window.innerHeight / 2) * 0.14) + 'px,0)';
      });
    };
    window.addEventListener('scroll', function () { if (!occupe) { occupe = true; requestAnimationFrame(parallaxe); } }, { passive: true });
    parallaxe();
  }

  /* 4. Carrousels : flèches sur les côtés des images, points juste dessous */
  var FL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="%D"/></svg>';
  function carrousel(car) {
    var piste = $('.piste', car), items = Array.prototype.slice.call(piste.children);
    if (!items.length) return;
    var vue = document.createElement('div'); vue.className = 'vue'; car.insertBefore(vue, piste); vue.appendChild(piste);
    var prev = document.createElement('button'), next = document.createElement('button'), pts = document.createElement('div');
    prev.type = next.type = 'button'; prev.className = 'fl g'; next.className = 'fl d';
    prev.setAttribute('aria-label', 'Précédent'); next.setAttribute('aria-label', 'Suivant');
    prev.innerHTML = FL.replace('%D', 'M15 5l-7 7 7 7'); next.innerHTML = FL.replace('%D', 'M9 5l7 7-7 7');
    pts.className = 'pts'; vue.appendChild(prev); vue.appendChild(next); car.appendChild(pts);
    piste.tabIndex = 0;
    var pas = function () { var a = items[0], b = items[1]; return b ? (b.offsetLeft - a.offsetLeft) : a.offsetWidth; };
    var visibles = function () { var p = pas(); return p > 0 ? Math.max(1, Math.round((piste.clientWidth + 1) / p)) : 1; };
    var maxIdx = function () { return Math.max(0, items.length - visibles()); };
    var idx = function () { var p = pas(); return p > 0 ? Math.min(maxIdx(), Math.round(piste.scrollLeft / p)) : 0; };
    var aller = function (i) { i = Math.max(0, Math.min(maxIdx(), i)); piste.scrollTo({ left: i * pas(), behavior: reduit ? 'auto' : 'smooth' }); };
    function dots() {
      pts.innerHTML = '';
      for (var i = 0; i <= maxIdx(); i++) {
        (function (i) {
          var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Aller à la diapositive ' + (i + 1));
          b.addEventListener('click', function () { aller(i); }); pts.appendChild(b);
        })(i);
      }
    }
    function maj() {
      if (pas() <= 0) return;
      var i = idx(), m = maxIdx();
      prev.disabled = i <= 0; next.disabled = i >= m;
      $$('button', pts).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      var cache = m === 0; prev.style.display = next.style.display = pts.style.display = cache ? 'none' : '';
    }
    prev.addEventListener('click', function () { aller(idx() - 1); });
    next.addEventListener('click', function () { aller(idx() + 1); });
    piste.addEventListener('scroll', function () { window.requestAnimationFrame(maj); }, { passive: true });
    piste.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { aller(idx() + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { aller(idx() - 1); e.preventDefault(); } });
    var refaire = function () { dots(); maj(); };
    window.addEventListener('resize', refaire);
    car.addEventListener('recalc', refaire);
    refaire();
    var delai = parseInt(car.getAttribute('data-auto'), 10);
    if (delai && !reduit) {
      var visible = false, pause = false;
      ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) { car.addEventListener(ev, function () { pause = true; }, { passive: true }); });
      ['pointerleave', 'focusout', 'touchend'].forEach(function (ev) { car.addEventListener(ev, function () { pause = false; }, { passive: true }); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .3 }).observe(car); else visible = true;
      setInterval(function () {
        if (pause || !visible || pas() <= 0) return;
        var i = idx(); aller(i >= maxIdx() ? 0 : i + 1);
      }, delai);
    }
  }
  $$('.car').forEach(carrousel);

  /* Photos en portrait dans les cadres larges : on les montre en entier sur un fond flou de la même image */
  $$('.volet .photo img').forEach(function (im) {
    var marque = function () {
      if (im.naturalHeight > im.naturalWidth * 1.05) {
        var f = im.closest('.photo'); f.classList.add('por'); f.style.setProperty('--bg', 'url("' + im.getAttribute('src') + '")');
      }
    };
    if (im.complete) marque(); else im.addEventListener('load', marque);
  });

  /* Curseur avant / après (comme sur la maquette Légaut) : un balayage automatique à l'arrivée, puis la main au visiteur */
  $$('[data-compare]').forEach(function (c) {
    var apres = $('.compare-after', c), poignee = $('.compare-handle', c), reglette = $('.compare-range', c), la = $('.compare-label.avant', c), lb2 = $('.compare-label.apres', c);
    function pos(p) {
      p = Math.max(0, Math.min(100, p));
      apres.style.clipPath = 'inset(0 0 0 ' + p + '%)'; poignee.style.left = p + '%';
      la.classList.toggle('cache', p < 14); lb2.classList.toggle('cache', p > 86);
    }
    var minuteur = null;
    var stop = function () { if (minuteur) { clearInterval(minuteur); minuteur = null; } };
    reglette.addEventListener('pointerdown', stop);
    reglette.addEventListener('input', function () { stop(); pos(+reglette.value); });
    pos(50);
    if (!reduit && 'IntersectionObserver' in window) {
      var vu = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; vu.disconnect();
        var v = 100; reglette.value = 100; pos(100);
        minuteur = setInterval(function () { v -= 2; if (v <= 50) { v = 50; stop(); } reglette.value = v; pos(v); }, 18);
      }, { threshold: .6 });
      vu.observe(c);
    }
  });

  /* 5. Onglets du gîte */
  var onglets = $$('.onglets [role="tab"]');
  onglets.forEach(function (t) {
    t.addEventListener('click', function () {
      onglets.forEach(function (o) { o.setAttribute('aria-selected', o === t ? 'true' : 'false'); });
      $$('.volet').forEach(function (v) { v.classList.toggle('on', v.id === t.getAttribute('aria-controls')); });
      $$('.volet.on .car').forEach(function (c) { c.dispatchEvent(new Event('recalc')); });
    });
    t.addEventListener('keydown', function (e) {
      var i = onglets.indexOf(t);
      if (e.key === 'ArrowRight') { onglets[(i + 1) % onglets.length].focus(); onglets[(i + 1) % onglets.length].click(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { onglets[(i + onglets.length - 1) % onglets.length].focus(); onglets[(i + onglets.length - 1) % onglets.length].click(); e.preventDefault(); }
    });
  });

  /* 6. Visionneuse photos : le plan, ainsi qu'un clic sur une photo pour l'ouvrir en grand */
  var lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap'), lbListe = [], lbI = 0, lbOpener = null;
  function lbShow() {
    var p = lbListe[lbI]; lbImg.src = p.s; lbImg.alt = p.c;
    lbCap.textContent = p.c + (lbListe.length > 1 ? ' (' + (lbI + 1) + ' sur ' + lbListe.length + ')' : '');
    var multi = lbListe.length > 1; $('#lb-g').style.display = multi ? '' : 'none'; $('#lb-d').style.display = multi ? '' : 'none';
  }
  function lbOpen(liste, i, opener) { lbListe = liste; lbI = i; lbOpener = opener || null; lb.classList.add('on'); document.body.classList.add('fige'); lbShow(); $('#lb-x').focus(); }
  function lbClose() { lb.classList.remove('on'); document.body.classList.remove('fige'); if (lbOpener) lbOpener.focus(); }
  $$('[data-album="plan"]').forEach(function (b) { b.addEventListener('click', function () { lbOpen([{ s: 'images/plan.jpg', c: 'Plan du gîte' }], 0, b); }); });
  $$('.volet .photo, .livre .photo').forEach(function (f) {
    f.style.cursor = 'zoom-in';
    f.addEventListener('click', function () {
      var gal = $$('.photo', f.closest('.piste')).map(function (x) { var im = $('img', x), c = $('figcaption', x); return { s: im.getAttribute('src'), c: c ? c.textContent : im.alt }; });
      lbOpen(gal, $$('.photo', f.closest('.piste')).indexOf(f), f);
    });
  });
  var galGite = function () { return $$('.volet .photo').map(function (x) { var im = $('img', x); return { s: im.getAttribute('src'), c: im.alt }; }); };
  $$('[data-zoom]').forEach(function (f) {
    f.addEventListener('click', function (e) {
      var g = galGite(), i = 0;
      if (e.target.closest('[data-galerie]')) i = 0; else g.forEach(function (x, k) { if (x.s === f.getAttribute('data-zoom')) i = k; });
      lbOpen(g, i, f.querySelector('button') || f);
    });
  });
  $('#lb-x').addEventListener('click', lbClose);
  $('#lb-g').addEventListener('click', function () { lbI = (lbI + lbListe.length - 1) % lbListe.length; lbShow(); });
  $('#lb-d').addEventListener('click', function () { lbI = (lbI + 1) % lbListe.length; lbShow(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') $('#lb-g').click();
    if (e.key === 'ArrowRight') $('#lb-d').click();
  });

  /* 7. Panneau de réservation (démonstration de l'application de gestion) */
  var CAP = 6;
  /* nuits déjà prises, pour la démonstration : du premier jour (inclus) au jour de départ (exclu) */
  var OCC = [['2026-11-06', '2026-11-09'], ['2026-12-19', '2027-01-03'], ['2027-02-12', '2027-02-15'], ['2027-03-27', '2027-04-04'], ['2027-05-06', '2027-05-10'], ['2027-07-10', '2027-07-24'], ['2027-08-07', '2027-08-14'], ['2027-10-23', '2027-10-30']];
  var resa = $('#resa'), corps = $('#resa-corps'), pied = $('#resa-pied'), etapesEl = $('#etapes'), ouvreur = null;
  var S = null;

  function d0(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function plus(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function jours(a, b) { return Math.round((b.getTime() - a.getTime()) / 864e5); }
  function euro(n) { return (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + NB + '€'; }
  function long(d) { return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  var occSet = {};
  OCC.forEach(function (r) { for (var d = d0(r[0]); d < d0(r[1]); d = plus(d, 1)) occSet[iso(d)] = 1; });
  function nuitLibre(d) { return !occSet[iso(d)]; }
  function plageLibre(a, b) { for (var d = a; d < b; d = plus(d, 1)) if (!nuitLibre(d)) return false; return true; }
  function aujourdhui() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12); }

  /* Tarifs 2026 du site actuel. Les règles exactes seront saisies dans l'application de gestion. */
  function ete(d) { var m = d.getMonth() + 1, j = d.getDate(); return (m === 7 && j >= 4) || m === 8 && j <= 30; }
  function tarifSemaine(d) { var m = d.getMonth() + 1; if (ete(d)) return 875; if (m === 5 || m === 6 || m === 9) return 500; return 400; }
  function nomSaison(r) { return r === 875 ? 'été' : r === 500 ? 'mai, juin et septembre' : 'basse saison'; }
  function regle(arr, dep, pers) {
    if (!arr || !dep) return { ok: false };
    var n = jours(arr, dep), enEte = false;
    for (var d = arr; d < dep; d = plus(d, 1)) if (ete(d)) enEte = true;
    if (pers > CAP) return { ok: false, msg: 'Le gîte accueille ' + CAP + ' personnes au plus.' };
    if (enEte && n % 7 !== 0) return { ok: false, msg: 'Du 4 juillet au 30 août, les séjours se font par tranches de 7 nuits.' };
    if (n < 2) return { ok: false, msg: 'Le séjour dure 2 nuits au minimum.' };
    return { ok: true, n: n };
  }
  function prix(arr, dep) {
    var n = jours(arr, dep), m = arr.getMonth() + 1, tot = 0, rates = {}, d;
    for (d = arr; d < dep; d = plus(d, 1)) { var r = tarifSemaine(d); rates[r] = 1; tot += r / 7; }
    var rs = Object.keys(rates);
    if (n === 2) { var p2 = (m === 4 || m === 5 || m === 6 || m === 11) ? 300 : 250; return { total: p2, lib: 'Forfait week-end, 2 nuits', note: '' }; }
    if (n <= 4) return { total: 300, lib: 'Forfait long week-end, ' + n + ' nuits', note: '' };
    return { total: Math.round(tot), lib: n + ' nuits au tarif de la semaine', note: rs.length === 1 ? 'Tarif ' + nomSaison(+rs[0]) + ' : ' + euro(+rs[0]) + ' la semaine' : 'Tarif de la semaine selon la saison' };
  }
  function repasPossible(arr) {
    if (ete(arr)) return false;
    var m = arr.getMonth() + 1, j = arr.getDate();
    return !((m === 12 && j >= 21) || (m === 1 && j <= 3));
  }

  function nouvelEtat() {
    var t = aujourdhui();
    return { etape: 1, adultes: 2, enfants: 0, arr: null, dep: null, mois: new Date(t.getFullYear(), t.getMonth(), 1, 12), draps: 0, repA: 0, repE: 0, repP: 0, f: { prenom: '', nom: '', tel: '', mail: '', msg: '' } };
  }
  function pers() { return S.adultes + S.enfants; }
  function totalOptions() { return S.draps * 15 + S.repA * 25 + S.repE * 10; }
  function ouvrir(btn) {
    ouvreur = btn || null; S = nouvelEtat(); resa.classList.add('on'); resa.setAttribute('aria-hidden', 'false'); document.body.classList.add('fige'); rendre();
    setTimeout(function () { var f = $('.fermer', resa); if (f) f.focus(); }, 60);
  }
  function fermer() { resa.classList.remove('on'); resa.setAttribute('aria-hidden', 'true'); document.body.classList.remove('fige'); if (ouvreur) ouvreur.focus(); }
  $$('[data-reserve]').forEach(function (b) { b.addEventListener('click', function () { ouvrir(b); }); });
  $$('[data-close]', resa).forEach(function (b) { b.addEventListener('click', fermer); });
  document.addEventListener('keydown', function (e) {
    if (!resa.classList.contains('on')) return;
    if (e.key === 'Escape') fermer();
    if (e.key === 'Tab') {
      var f = $$('button:not([disabled]),input,textarea,[href]', $('.pan', resa)).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
    }
  });

  function stepper(id, val, min, max, titre, sous) {
    return '<div class="cpt-ligne"><div>' + titre + (sous ? '<small>' + sous + '</small>' : '') + '</div><div class="stp"><button type="button" data-st="' + id + '" data-d="-1" aria-label="Moins"' + (val <= min ? ' disabled' : '') + '>&minus;</button><output aria-live="polite">' + val + '</output><button type="button" data-st="' + id + '" data-d="1" aria-label="Plus"' + (val >= max ? ' disabled' : '') + '>+</button></div></div>';
  }
  function tableauMois() {
    var m = S.mois, y = m.getFullYear(), mo = m.getMonth(), prem = new Date(y, mo, 1, 12), dec = (prem.getDay() + 6) % 7, nb = new Date(y, mo + 1, 0).getDate();
    var t = aujourdhui(), limite = new Date(t.getFullYear() + 2, t.getMonth(), 1, 12);
    var h = '<div class="mois"><button type="button" data-mois="-1" aria-label="Mois précédent"' + (prem <= new Date(t.getFullYear(), t.getMonth(), 1, 12) ? ' disabled' : '') + '>&#8249;</button><b>' + prem.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + '</b><button type="button" data-mois="1" aria-label="Mois suivant"' + (plus(prem, 32) >= limite ? ' disabled' : '') + '>&#8250;</button></div><div class="cal" role="group" aria-label="Planning">';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (j) { h += '<span class="j" aria-hidden="true">' + j + '</span>'; });
    for (var i = 0; i < dec; i++) h += '<span class="vide"></span>';
    for (var k = 1; k <= nb; k++) {
      var d = new Date(y, mo, k, 12), cl = [], dis = false, libre = nuitLibre(d);
      if (!libre) cl.push('occ');
      var passe = d < t;
      if (S.arr && !S.dep) {
        if (d > S.arr) dis = passe || !plageLibre(S.arr, d); else dis = passe || !libre;
      } else dis = passe || !libre;
      if (S.arr && iso(d) === iso(S.arr)) cl.push('deb');
      if (S.dep && iso(d) === iso(S.dep)) cl.push('fin');
      if (S.arr && S.dep && d > S.arr && d < S.dep) cl.push('dans');
      var lib = long(d) + (libre ? '' : ', nuit occupée');
      h += '<button type="button" class="' + cl.join(' ') + '" data-jour="' + iso(d) + '"' + (dis ? ' disabled' : '') + ' aria-label="' + lib + '">' + k + '</button>';
    }
    return h + '</div><div class="legende"><span><i style="background:var(--vert)"></i>Votre séjour</span><span><i style="background:repeating-linear-gradient(135deg,#fff 0 3px,rgba(157,116,48,.45) 3px 5px)"></i>Occupé</span></div>';
  }

  function etape1() {
    var r = regle(S.arr, S.dep, pers()), tropMonde = pers() > CAP;
    var h = '<div class="demo">Démonstration de l\'application de gestion : les disponibilités sont fictives et rien n\'est envoyé.</div><h3>Combien de personnes ?</h3>';
    h += stepper('adultes', S.adultes, 1, CAP, 'Adultes') + stepper('enfants', S.enfants, 0, CAP, 'Enfants');
    if (tropMonde) h += '<div class="sejour alerte" role="alert">Le gîte accueille ' + CAP + ' personnes au plus.</div>';
    h += '<h3 style="margin-top:26px">Vos dates</h3><p style="margin:0;font-size:.98rem">Choisissez votre jour d\'arrivée, puis votre jour de départ.</p>' + tableauMois();
    if (S.arr && S.dep) {
      h += '<div class="sejour' + (r.ok ? '' : ' alerte') + '" role="status">Arrivée : <b>' + long(S.arr) + '</b><br>Départ : <b>' + long(S.dep) + '</b><br>' + jours(S.arr, S.dep) + ' nuit' + (jours(S.arr, S.dep) > 1 ? 's' : '') + (r.ok || !r.msg ? '' : '<br>' + r.msg) + '</div>';
    } else if (S.arr) h += '<div class="sejour" role="status">Arrivée : <b>' + long(S.arr) + '</b>. Choisissez maintenant votre jour de départ.</div>';
    corps.innerHTML = h;
    pied.innerHTML = '<div class="tot">Votre séjour<b>' + (S.arr && S.dep ? jours(S.arr, S.dep) + ' nuits' : 'à choisir') + '</b></div><button class="btn" type="button" data-go="2"' + (r.ok && !tropMonde ? '' : ' disabled') + '>Valider mes dates</button>';
  }
  function etape2() {
    var p = prix(S.arr, S.dep), n = jours(S.arr, S.dep), taxe = 0.9 * S.adultes * n;
    var h = '<h3>Le gîte pour vos dates</h3><div class="logt"><img src="images/salon.jpg" alt="Le salon du gîte Le Flahut"><div class="in"><h4>Le Flahut</h4><p style="margin:0 0 8px;font-size:.96rem">3 chambres, 6 couchages. Pour ' + pers() + ' personne' + (pers() > 1 ? 's' : '') + '.</p><span class="puce ok">Disponible</span><p style="margin:10px 0 0;font-size:.96rem">Du ' + long(S.arr) + '<br>au ' + long(S.dep) + '</p><div class="prix">' + euro(p.total) + '</div>';
    h += '<table class="detail"><tr><td>' + p.lib + '</td><td>' + euro(p.total) + '</td></tr>' + (p.note ? '<tr><td colspan="2" style="color:var(--brun2)">' + p.note + '</td></tr>' : '') + '<tr><td>Taxe de séjour, à régler en plus</td><td>' + euro(taxe) + '</td></tr></table></div></div>';
    h += '<p style="margin-top:18px;font-size:.95rem;color:var(--brun2)">La taxe de séjour est de 0,90' + NB + '€ par adulte et par nuit, fixée par la Communauté de communes. Draps et repas se choisissent à l\'étape suivante.</p>';
    corps.innerHTML = h;
    pied.innerHTML = '<div class="tot">Séjour<b>' + euro(p.total) + '</b></div><button class="retour btn contour" type="button" data-go="1" style="padding:.7em 1.1em">Retour</button><button class="btn" type="button" data-go="3">Continuer</button>';
  }
  function etape3() {
    var repas = repasPossible(S.arr), maxP = S.enfants;
    var h = '<h3>Vos options</h3><p style="font-size:.97rem;margin-top:0">Rien n\'est obligatoire. Vous pouvez passer cette étape.</p>';
    h += '<div class="opt"><h4>Draps</h4><p>15' + NB + '€ la parure, déposée au pied du lit (couverture et couette fournies). Les serviettes de toilette ne sont pas fournies.</p>' + stepper('draps', S.draps, 0, 3, 'Parures de draps', '') + '</div>';
    h += '<div class="opt' + (repas ? '' : ' off') + '"><h4>Repas du soir d\'arrivée</h4><p>' + (repas ? 'À déguster dans le gîte : entrée, plat, fromage, dessert et vin.' : 'Non proposé en été ni pendant les vacances de Noël.') + '</p>';
    if (repas) {
      h += stepper('repA', S.repA, 0, S.adultes, 'Adultes', '25' + NB + '€ par personne') + stepper('repE', S.repE, 0, S.enfants, 'Enfants de 9 à 16 ans', '10' + NB + '€ par enfant') + stepper('repP', S.repP, 0, Math.max(0, S.enfants - S.repE), 'Enfants de moins de 8 ans', 'Repas offert');
    }
    h += '</div>';
    h += '<p style="font-size:.93rem;color:var(--brun2)">En saison froide (à partir d\'octobre), une participation au chauffage d\'environ 8' + NB + '€ par jour est à prévoir : Laurent vous indique le montant dans sa réponse.</p>';
    corps.innerHTML = h;
    var p = prix(S.arr, S.dep);
    pied.innerHTML = '<div class="tot">Total estimé<b>' + euro(p.total + totalOptions()) + '</b></div><button class="retour btn contour" type="button" data-go="2" style="padding:.7em 1.1em">Retour</button><button class="btn" type="button" data-go="4">Continuer</button>';
  }
  function champ(id, lib, type, val, auto, extra) {
    return '<label for="f-' + id + '">' + lib + '</label><input id="f-' + id + '" name="' + id + '" type="' + type + '" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="' + auto + '"' + (extra || '') + '><div class="err" id="e-' + id + '"></div>';
  }
  function etape4() {
    var p = prix(S.arr, S.dep), tot = p.total + totalOptions();
    var h = '<h3>Vos coordonnées</h3><form class="rp" id="rp" novalidate><div class="deux"><div>' + champ('prenom', 'Prénom', 'text', S.f.prenom, 'given-name') + '</div><div>' + champ('nom', 'Nom', 'text', S.f.nom, 'family-name') + '</div></div>' + champ('tel', 'Numéro de téléphone', 'tel', S.f.tel, 'tel') + champ('mail', 'Adresse e-mail', 'email', S.f.mail, 'email') + '<label for="f-msg">Un message (facultatif)</label><textarea id="f-msg" name="msg" rows="3">' + S.f.msg + '</textarea></form>';
    h += '<div class="recap"><b>Votre demande</b><br>Le Flahut, du ' + S.arr.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' au ' + S.dep.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + '<br>' + S.adultes + ' adulte' + (S.adultes > 1 ? 's' : '') + (S.enfants ? ', ' + S.enfants + ' enfant' + (S.enfants > 1 ? 's' : '') : '') + '<br>Séjour ' + euro(p.total) + (totalOptions() ? ', options ' + euro(totalOptions()) : '') + '</div>';
    corps.innerHTML = h;
    pied.innerHTML = '<div class="tot">Total estimé<b>' + euro(tot) + '</b></div><button class="retour btn contour" type="button" data-go="3" style="padding:.7em 1.1em">Retour</button><button class="btn" type="button" id="envoyer">Envoyer ma demande</button>';
    $('#envoyer').addEventListener('click', envoyer);
  }
  function lireForm() {
    var f = S.f; f.prenom = $('#f-prenom').value.trim(); f.nom = $('#f-nom').value.trim(); f.tel = $('#f-tel').value.trim(); f.mail = $('#f-mail').value.trim(); f.msg = $('#f-msg').value.trim();
  }
  function envoyer() {
    lireForm(); var f = S.f, ok = true;
    function er(id, m) { $('#e-' + id).textContent = m || ''; if (m) ok = false; }
    er('prenom', f.prenom ? '' : 'Indiquez votre prénom.');
    er('nom', f.nom ? '' : 'Indiquez votre nom.');
    er('tel', /[0-9]{6,}/.test(f.tel.replace(/[\s.+()-]/g, '')) ? '' : 'Indiquez un numéro de téléphone.');
    er('mail', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.mail) ? '' : 'Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.');
    if (!ok) { var premier = $$('.err', corps).filter(function (e) { return e.textContent; })[0]; if (premier) premier.previousElementSibling.focus(); return; }
    S.etape = 5; rendre();
  }
  function etape5() {
    var f = S.f;
    corps.innerHTML = '<div class="fin-ok"><div class="coche"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>Merci ' + f.prenom.replace(/</g, '&lt;') + ', votre demande est enregistrée</h3><p>Voici ce qui se passe ensuite : Laurent vous répond par courriel avec une proposition. Après votre accord, un contrat de location vous est envoyé. La réservation devient effective à la réception du contrat signé et d\'un acompte d\'environ 30' + NB + '% de la semaine de location.</p><div class="demo">Démonstration : aucune demande n\'a été envoyée. Avec l\'application de gestion, la demande arrive dans la boîte de Laurent et le planning se met à jour.</div></div>';
    pied.innerHTML = '<div class="tot"></div><button class="btn" type="button" data-close>Fermer</button>';
    $('[data-close]', pied).addEventListener('click', fermer);
  }
  function rendre() {
    $$('li', etapesEl).forEach(function (li, i) { li.className = i + 1 < S.etape ? 'fait' : (i + 1 === S.etape ? 'cours' : ''); li.setAttribute('aria-current', i + 1 === S.etape ? 'step' : 'false'); });
    [null, etape1, etape2, etape3, etape4, etape5][S.etape]();
    corps.scrollTop = 0;
  }
  corps.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-st')) {
      var k = b.getAttribute('data-st'), dlt = +b.getAttribute('data-d');
      S[k] = Math.max(0, S[k] + dlt);
      if (k === 'adultes') { S.adultes = Math.max(1, S.adultes); if (S.repA > S.adultes) S.repA = S.adultes; }
      if (k === 'enfants') { if (S.repE > S.enfants) S.repE = S.enfants; if (S.repE + S.repP > S.enfants) S.repP = Math.max(0, S.enfants - S.repE); }
      if (k === 'repE' && S.repE + S.repP > S.enfants) S.repP = Math.max(0, S.enfants - S.repE);
      var y = corps.scrollTop; rendre(); corps.scrollTop = y; var again = $('[data-st="' + k + '"][data-d="' + dlt + '"]', corps); if (again && !again.disabled) again.focus();
      return;
    }
    if (b.hasAttribute('data-mois')) { S.mois = new Date(S.mois.getFullYear(), S.mois.getMonth() + (+b.getAttribute('data-mois')), 1, 12); var y2 = corps.scrollTop; rendre(); corps.scrollTop = y2; var m2 = $('[data-mois="' + b.getAttribute('data-mois') + '"]', corps); if (m2 && !m2.disabled) m2.focus(); return; }
    if (b.hasAttribute('data-jour')) {
      var d = d0(b.getAttribute('data-jour'));
      if (!S.arr || S.dep) { S.arr = d; S.dep = null; }
      else if (d <= S.arr) { S.arr = d; }
      else if (plageLibre(S.arr, d)) { S.dep = d; }
      else { S.arr = d; S.dep = null; }
      var y3 = corps.scrollTop; rendre(); corps.scrollTop = y3; var j = $('[data-jour="' + iso(d) + '"]', corps); if (j) j.focus();
    }
  });
  pied.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b || b.disabled) return;
    if (S.etape === 4) lireForm();
    S.etape = +b.getAttribute('data-go'); rendre();
  });

  /* 8. Formulaire de questions (démonstration) */
  var fc = $('#form-contact'), mc = $('#merci-contact');
  fc.addEventListener('submit', function (e) {
    e.preventDefault();
    var nom = $('#c-nom').value.trim(), mail = $('#c-mail').value.trim(), msg = $('#c-msg').value.trim();
    if (!nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || !msg) {
      mc.classList.add('on'); mc.textContent = 'Il manque votre nom, une adresse e-mail valide ou votre question.'; return;
    }
    mc.classList.add('on'); mc.textContent = 'Merci ' + nom + ', votre question est notée. Démonstration : rien n\'a été envoyé. Avec le site en ligne, elle arrive directement dans la boîte de Laurent.';
    fc.reset();
  });
})();
