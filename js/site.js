import { LOOKS, DETAILS, KIT, T } from './data.js';

const $ = s => document.querySelector(s);
const IG = c => `https://www.instagram.com/reel/${c}/`;
let lang = localStorage.getItem('ep-lang') === 'ru' ? 'ru' : 'uz';
let active = 0;

/* Til */
function applyLang() {
  document.documentElement.lang = lang;
  $('#lang').textContent = lang === 'uz' ? 'RU' : 'UZ';
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = T[lang][e.dataset.t]; });
  document.querySelectorAll('[data-t-aria]').forEach(e => e.setAttribute('aria-label', T[lang][e.dataset.tAria]));
  document.querySelectorAll('[data-det]').forEach(e => { e.textContent = DETAILS[+e.dataset.det][lang]; });
  $('#kitList').innerHTML = KIT.map(k => `<li><b>${k[lang][0]}</b><span>${k[lang][1]}</span></li>`).join('');
  document.querySelectorAll('.flat-item').forEach((e, i) => {
    e.querySelector('h2').textContent = LOOKS[i].name[lang];
    e.querySelector('p').textContent = LOOKS[i].note[lang];
  });
  showLook(active, true);
  if (!dlg.hidden) fillDlg();
}
$('#lang').addEventListener('click', () => {
  lang = lang === 'uz' ? 'ru' : 'uz';
  localStorage.setItem('ep-lang', lang);
  applyLang();
});

/* Faol obraz matni */
const lookEl = $('#look');
const pad = n => String(n + 1).padStart(2, '0');
function showLook(i, instant) {
  active = i;
  const l = LOOKS[i];
  const put = () => {
    $('#lookNum').textContent = pad(i);
    $('#lookName').textContent = l.name[lang];
    $('#lookNote').textContent = l.note[lang];
  };
  document.querySelectorAll('#ticks button').forEach((b, k) => {
    b.classList.toggle('on', k === i);
    if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  if (instant) { put(); return; }
  lookEl.style.opacity = 0;
  clearTimeout(showLook.t);
  showLook.t = setTimeout(() => { put(); lookEl.style.opacity = ''; }, 170);
}
$('#lookAll').textContent = String(LOOKS.length).padStart(2, '0');
$('#ticks').innerHTML = LOOKS.map((l, i) => `<li><button type="button" aria-label="${pad(i)}">${pad(i)}</button></li>`).join('');

/* Dialog */
const dlg = $('#dlg'), dlgV = $('#dlgVideo');
let dlgI = 0, lastFocus = null, stage = null;
function fillDlg() {
  const l = LOOKS[dlgI];
  $('#dlgNum').textContent = `${pad(dlgI)} / ${String(LOOKS.length).padStart(2, '0')}`;
  $('#dlgName').textContent = l.name[lang];
  $('#dlgNote').textContent = l.note[lang];
  $('#dlgReel').href = IG(l.reel);
}
function setDlgVideo() {
  const l = LOOKS[dlgI];
  dlgV.poster = l.poster; dlgV.src = l.video;
  dlgV.play().catch(() => {});
}
function openDlg(i) {
  dlgI = i; lastFocus = document.activeElement;
  dlg.hidden = false; document.documentElement.style.overflow = 'hidden';
  stage && stage.pauseVideo(true);
  fillDlg(); setDlgVideo();
  $('#dlgX').focus();
}
function closeDlg() {
  dlg.hidden = true; document.documentElement.style.overflow = '';
  dlgV.pause(); dlgV.removeAttribute('src'); dlgV.load();
  stage && stage.pauseVideo(false);
  lastFocus && lastFocus.focus && lastFocus.focus();
}
function moveDlg(d) { dlgI = (dlgI + d + LOOKS.length) % LOOKS.length; fillDlg(); setDlgVideo(); }
$('#dlgX').addEventListener('click', closeDlg);
$('#dlgPrev').addEventListener('click', () => moveDlg(-1));
$('#dlgNext').addEventListener('click', () => moveDlg(1));
dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
addEventListener('keydown', e => {
  if (dlg.hidden) return;
  if (e.key === 'Escape') closeDlg();
  if (e.key === 'ArrowLeft') moveDlg(-1);
  if (e.key === 'ArrowRight') moveDlg(1);
});
$('#lookOpen').addEventListener('click', () => openDlg(active));

/* Detallar */
$('#detGrid').innerHTML = DETAILS.map((d, i) => `<figure class="det"><video data-lazy="${d.video}" poster="${d.poster}" muted loop playsinline preload="none"></video><figcaption data-det="${i}"></figcaption></figure>`).join('');

/* Videolar faqat ko'rinib turganda ishlaydi */
const io = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) {
    if (v.dataset.lazy && !v.src) v.src = v.dataset.lazy;
    v.play().catch(() => {});
  } else v.pause();
}), { rootMargin: '10% 0px' });
document.querySelectorAll('video[data-lazy]').forEach(v => io.observe(v));

/* Detal kartalari scrollda chuqurlikdan ko'tariladi */
const dets = [...document.querySelectorAll('.det')];
function tiltDets() {
  const h = innerHeight;
  dets.forEach((d, i) => {
    const r = d.getBoundingClientRect();
    if (r.top > h * 1.2 || r.bottom < -h * .2) return;
    const q = Math.max(0, Math.min(1, (h - r.top) / (h * .75)));
    const e = 1 - (1 - q) ** 3;
    d.style.transform = `rotateX(${(1 - e) * 24}deg) translateZ(${(e - 1) * 110}px)`;
    d.style.opacity = .25 + e * .75;
  });
}

/* Sahna */
const top = $('.top'), heroEl = $('#hero'), ticksEl = $('#ticks'), stageEl = $('.stage');
const N = LOOKS.length;
const HOLD = 1.05; // har bir obrazga ajratilgan ekran balandligi
function layoutStage() { stageEl.style.height = `${(N * HOLD + 1.7) * innerHeight / 100 * 100}px`; }
function stationEase(s) {
  const f = Math.floor(s), r = s - f;
  const t = Math.min(1, Math.max(0, (r - .3) / .4));
  return f + t * t * (3 - 2 * t);
}
function syncScroll() {
  const vh = innerHeight, y = scrollY;
  top.classList.toggle('solid', y > stageEl.offsetHeight - vh * 1.05);
  tiltDets();
  if (!stage) return;
  const heroP = Math.min(1, y / (vh * 1.0));
  const after = y - vh * 1.0;
  const span = (N - 1) * HOLD * vh;
  const raw = Math.max(0, Math.min(N - 1, after / span * (N - 1)));
  const outro = Math.max(0, Math.min(1, (after - span) / (vh * .7)));
  stage.state.hero = heroP;
  stage.state.station = stationEase(raw);
  stage.state.outro = outro;
  stage.state.visible = y < stageEl.offsetHeight;
  heroEl.style.visibility = heroP > .28 ? 'hidden' : '';
  heroEl.style.transform = `translateY(${heroP * -40}px)`;
  heroEl.style.filter = heroP > .01 ? `opacity(${1 - heroP * 3.6})` : '';
  const on = heroP > .9 && outro < .35;
  lookEl.classList.toggle('on', on);
  ticksEl.classList.toggle('on', on);
}
function jumpTo(i) {
  const vh = innerHeight;
  scrollTo({ top: vh * 1.0 + i * HOLD * vh + .001, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
}
ticksEl.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  jumpTo([...ticksEl.querySelectorAll('button')].indexOf(b));
});
document.querySelector('.top-nav a[href="#obrazlar"]').addEventListener('click', e => { if (stage) { e.preventDefault(); jumpTo(0); } });

function flatFallback() {
  document.documentElement.classList.add('no3d');
  const f = $('#flat'); f.hidden = false;
  f.innerHTML = LOOKS.map(l => `<article class="flat-item"><img src="${l.poster}" alt="" loading="lazy"><h2></h2><p></p></article>`).join('');
}

function hasGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

async function boot() {
  applyLang();
  layoutStage();
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW || innerWidth > 760) { lastW = innerWidth; layoutStage(); } syncScroll(); });
  addEventListener('scroll', syncScroll, { passive: true });
  if (!hasGL() || matchMedia('(prefers-reduced-motion:reduce)').matches) {
    flatFallback(); applyLang(); $('#hero').hidden = true; syncScroll(); return;
  }
  const { createStage } = await import('./stage.js');
  stage = await createStage($('#gl'), LOOKS, i => showLook(i));
  syncScroll();

  // Panelni bosish: ro'parasidagini ochadi, yondagisiga o'tadi
  let down = null;
  addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, { passive: true });
  addEventListener('click', e => {
    if (!dlg.hidden || !down || e.target.closest('a,button,.after,.top')) return;
    if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
    if (scrollY < innerHeight * .9 || stage.state.outro > .3) return;
    const i = stage.pick(e.clientX, e.clientY);
    if (i < 0) return;
    if (i === active) openDlg(i); else jumpTo(i);
  });
}
boot().catch(err => { console.error(err); flatFallback(); applyLang(); });
