/* =========================================================
   Sintonía — lógica del prototipo
   ========================================================= */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const W = 1920;
  let Z = 1;

  /* ---------------- escala del artboard ---------------- */
  function fit() {
    const vw = document.documentElement.clientWidth || window.innerWidth;
    Z = Math.max(0.2, vw / W);
    app.style.setProperty('--z', Z);
    updateSticky();
  }

  /* ---------------- rutas ---------------- */
  const screens = $$('.screen');
  const ids = screens.map(s => s.id.replace(/^s-/, ''));
  function show(id, keepScroll) {
    if (!ids.includes(id)) id = 'inicio';
    screens.forEach(s => s.classList.toggle('active', s.id === 's-' + id));
    const s = $('#s-' + id);
    document.title = 'Sintonía · ' + (s.dataset.title || '');
    if (!keepScroll) window.scrollTo(0, 0);
    updateSticky();
  }
  function go(id) {
    if (location.hash === '#/' + id) show(id);
    else location.hash = '#/' + id;
  }
  window.addEventListener('hashchange', () => show(location.hash.replace(/^#\/?/, '')));

  /* ---------------- estado de controles ---------------- */
  function setSel(el, on) {
    el.dataset.sel = on ? '1' : '0';
    el.classList.toggle('diff', el.dataset.sel !== el.dataset.baked);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function groupOf(el) {
    const scr = el.closest('.screen');
    return $$(`.ctl[data-group="${el.dataset.group}"]`, scr);
  }
  function toggle(el) {
    const g = groupOf(el);
    const multi = el.dataset.multi === '1' || el.classList.contains('check');
    const on = el.dataset.sel === '1';
    if (multi) {
      const max = +el.dataset.max || 0;
      if (!on && max && g.filter(x => x.dataset.sel === '1').length >= max) {
        toast(`Puedes seleccionar máximo ${max} categorías`);
        return;
      }
      setSel(el, !on);
    } else {
      g.forEach(x => setSel(x, x === el ? true : false));
    }
    el.dispatchEvent(new CustomEvent('sint:change', { bubbles: true }));
  }

  /* ---------------- toast ---------------- */
  let tt;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- clicks globales ---------------- */
  document.addEventListener('click', e => {
    const go_ = e.target.closest('[data-go]');
    if (go_ && go_.tagName !== 'FORM') { e.preventDefault(); go(go_.dataset.go); return; }

    const act = e.target.closest('[data-act]');
    if (act) { e.preventDefault(); action(act.dataset.act, act); return; }

    const date = e.target.closest('.date');
    if (date) { openDate(date); return; }

    const ctl = e.target.closest('.ctl[data-group]');
    if (ctl) {
      if (ctl.classList.contains('conv')) { openConv(+ctl.dataset.idx); return; }
      toggle(ctl);
      return;
    }
    const save = e.target.closest('.save');
    if (save) {
      const on = save.dataset.sel !== '1';
      save.dataset.sel = on ? '1' : '0';
      toast(on ? 'Trabajo guardado' : 'Trabajo eliminado de guardados');
    }
  });

  function action(a, el) {
    if (a === 'finalizar') {
      toast('¡Tu oferta de trabajo fue publicada!');
      setTimeout(() => go('inicio'), 900);
    } else if (a === 'limpiar') {
      clearFilters();
    } else if (a === 'send') {
      sendMessage();
    } else if (a === 'focus-compose') {
      $('.compose input').focus();
    } else if (a.startsWith('scroll:')) {
      const t = $('#a-' + a.slice(7));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (a.startsWith('pf:')) {
      const tag = a.slice(3).toLowerCase();
      const chip = $$('#s-perfil-nathy .ctl[data-group="pf"]').find(c => c.dataset.value.toLowerCase() === tag);
      if (chip) { toggle(chip); $('#a-portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  }

  /* ---------------- campos de texto ---------------- */
  function syncFilled(inp) {
    const box = inp.closest('.field, .hsearch, .compose');
    if (box) box.classList.toggle('filled', inp.value.length > 0);
  }
  document.addEventListener('input', e => {
    if (e.target.matches('input, textarea')) syncFilled(e.target);
  });

  // búsqueda del header
  $$('.hsearch').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); go('resultados'); }));
  // categoría del buscador (se sincroniza en todas las pantallas)
  $$('.hsel select').forEach(sel => sel.addEventListener('change', () => {
    $$('.hsel').forEach(h => {
      $('select', h).value = sel.value;
      $('.v', h).textContent = sel.value;
      h.classList.toggle('diff', sel.value !== 'Acróbatas');
    });
  }));

  // adjuntar (paso 2)
  $$('input[type=file][data-out]').forEach(inp => inp.addEventListener('change', () => {
    const out = document.getElementById(inp.dataset.out);
    const n = inp.files.length;
    out.textContent = n ? (n === 1 ? inp.files[0].name : `${n} archivos adjuntos`) : '';
  }));

  // moneda (paso 3)
  $$('.sel:not(.big) select').forEach(sel => sel.addEventListener('change', () => {
    const box = sel.closest('.sel');
    $('.v', box).textContent = sel.value;
    box.classList.toggle('diff', sel.value !== 'USD');
  }));

  // fechas (paso 3)
  function openDate(box) {
    const inp = $('input', box);
    try { inp.showPicker(); } catch (err) { inp.focus(); inp.click(); }
  }
  const fmt = v => {
    if (!v) return '';
    const [y, m, d] = v.split('-').map(Number);
    const mes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][m - 1];
    return `${String(d).padStart(2, '0')} ${mes} ${y}`;
  };
  $$('.date input').forEach(inp => inp.addEventListener('change', () => {
    const box = inp.closest('.date');
    const v = $('.v', box);
    v.dataset.orig = v.dataset.orig || v.textContent;
    v.textContent = inp.value ? fmt(inp.value) : v.dataset.orig;
    box.classList.toggle('diff', !!inp.value);
    if (inp.value) {
      const flex = $('#s-paso-3 .ctl[data-group="p3-fecha"]');
      if (flex) setSel(flex, false);
    }
  }));
  document.addEventListener('sint:change', e => {
    const el = e.target;
    if (el.dataset.group === 'p3-fecha' && el.dataset.sel === '1') {
      $$('#s-paso-3 .date').forEach(b => {
        const inp = $('input', b); inp.value = '';
        const v = $('.v', b); if (v.dataset.orig) v.textContent = v.dataset.orig;
        b.classList.remove('diff');
      });
    }
    if (el.dataset.group === 'pf') filterPortfolio(el.dataset.sel === '1' ? el.dataset.value : 'Todo');
  });

  /* ---------------- filtros ---------------- */
  const DEP = window.SINTONIA_DEP || {};
  const depSel = $('.bigsel[data-name="dep"]');
  const munSel = $('.bigsel[data-name="mun"]');
  function setBar(name, text, changed) {
    const box = $(`.sel.big[data-name="${name}"]`);
    $('.v', box).textContent = text;
    box.classList.toggle('diff', changed);
  }
  if (depSel) {
    depSel.addEventListener('change', () => {
      const d = depSel.value;
      setBar('dep', d || 'Seleccionar departamento', !!d);
      munSel.innerHTML = '<option value="">Seleccionar  municipio o ciudad</option>' +
        (DEP[d] || []).map(c => `<option>${c}</option>`).join('');
      setBar('mun', 'Seleccionar  municipio o ciudad', false);
    });
    munSel.addEventListener('mousedown', e => {
      if (!depSel.value) { e.preventDefault(); toast('Primero selecciona un departamento'); }
    });
    munSel.addEventListener('change', () => setBar('mun', munSel.value || 'Seleccionar  municipio o ciudad', !!munSel.value));
  }

  // slider de presupuesto
  const slider = $('.slider');
  if (slider) {
    const track = $('.track', slider);
    const tip = $('.tip', slider);
    const min = +slider.dataset.min, max = +slider.dataset.max;
    const P0 = (1189 - 153.8) / (1745.1 - 153.8);
    let p = P0;
    const paint = () => {
      const left = track.offsetLeft + p * track.offsetWidth;
      slider.style.setProperty('--tx', left + 'px');
      slider.style.setProperty('--p', (p * 100).toFixed(2) + '%');
      const v = Math.round((min + p * (max - min)) / 5) * 5;
      tip.textContent = v >= max ? '$1,000+' : '$' + v.toLocaleString('en-US');
    };
    const setFrom = ev => {
      const r = track.getBoundingClientRect();
      p = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      paint();
    };
    slider.addEventListener('pointerdown', ev => {
      slider.setPointerCapture(ev.pointerId);
      slider.classList.add('diff', 'drag');
      setFrom(ev);
    });
    slider.addEventListener('pointermove', ev => { if (slider.classList.contains('drag')) setFrom(ev); });
    const end = () => slider.classList.remove('drag');
    slider.addEventListener('pointerup', end);
    slider.addEventListener('pointercancel', end);
    slider.reset = () => { p = P0; paint(); slider.classList.remove('diff'); };
    paint();
  }

  function clearFilters() {
    const scr = $('#s-filtros');
    $$('.ctl[data-group]', scr).forEach(c => setSel(c, false));
    if (depSel) { depSel.value = ''; depSel.dispatchEvent(new Event('change')); }
    if (slider) slider.reset();
    toast('Filtros limpiados');
  }

  /* ---------------- perfil: columna fija + portfolio ---------------- */
  function updateSticky() {
    const st = $('#s-perfil-nathy .stick');
    if (!st) return;
    const vh = window.innerHeight / Z;
    const h = st.offsetHeight;
    st.style.setProperty('--st', Math.min(10, vh - h - 10) + 'px');
  }
  function filterPortfolio(tag) {
    const grid = $('#s-perfil-nathy .pfgrid');
    const t = (tag || 'Todo').toLowerCase();
    if (t === 'todo' || t.startsWith('más')) { grid.classList.remove('on', 'none'); return; }
    const tiles = $$('.tile', grid);
    const cols = [10.9, 417.1, 823.7];
    const hgt = [24, 24, 24];
    let n = 0;
    tiles.forEach(tl => {
      const ok = tl.dataset.tag.toLowerCase() === t;
      tl.classList.toggle('show', ok);
      if (ok) {
        const c = n % 3;
        tl.style.left = cols[c] + 'px';
        tl.style.top = hgt[c] + 'px';
        hgt[c] += tl.offsetHeight + 24 || parseFloat(tl.style.height) + 24;
        n++;
      }
    });
    grid.classList.add('on');
    grid.classList.toggle('none', n === 0);
  }

  /* ---------------- mensajes ---------------- */
  const CONVS = [
    { name: 'Eventos Luna Azul', sub: 'Empresa  ·  4.9 ★  (32 reseñas)', msgs: [],
      replies: ['¡Perfecto! Te confirmo los detalles del montaje mañana.', 'Gracias, lo comparto con los novios y te escribo.', '¡Excelente! Quedamos atentos.'] },
    { name: 'Magic Moments', sub: 'Eventos', msgs: [{ who: 'in', text: 'Gracias por la propuesta. Quedo atento a tu cotización final para el evento corporativo.', time: '2 min' }],
      replies: ['Perfecto, lo reviso con el equipo y te confirmo.'] },
    { name: 'Fantasía Producciones', sub: 'Productora', msgs: [{ who: 'in', text: '¿Podrías mandarme tu portafolio?', time: '2 min' }],
      replies: ['¡Gracias! Lo revisamos y te contactamos pronto.'] },
    { name: 'Producciones Escénicas SV', sub: 'Eventos', msgs: [{ who: 'in', text: '¡Buen día! Claro, te paso los planos del escenario para que los revises.', time: '2 min' }],
      replies: ['Cualquier duda con los planos me avisas.'] }
  ];
  let current = 0;
  const chat = $('#s-mensajes .chat');
  const thread = chat && $('.thread', chat);
  const head = $('#s-mensajes .chathead');
  const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  function bubble(m) {
    const d = document.createElement('div');
    d.className = 'msg ' + m.who + (m.typing ? ' typing' : '');
    const p = document.createElement('p');
    p.textContent = m.text;
    const t = document.createElement('time');
    t.textContent = m.time || '';
    const av = document.createElement('i');
    av.className = 'av';
    d.append(av, p, t);
    return d;
  }
  function renderConv() {
    const c = CONVS[current];
    chat.classList.toggle('other', current !== 0);
    head.classList.toggle('show', current !== 0);
    $('.n', head).textContent = c.name;
    $('.s', head).textContent = c.sub;
    thread.innerHTML = '';
    c.msgs.forEach(m => thread.appendChild(bubble(m)));
    chat.scrollTop = current === 0 && !c.msgs.length ? 0 : chat.scrollHeight;
  }
  function openConv(i) {
    current = i;
    $$('#s-mensajes .conv').forEach(c => setSel(c, +c.dataset.idx === i));
    renderConv();
  }
  function sendMessage() {
    const inp = $('#s-mensajes .compose input');
    const text = inp.value.trim();
    if (!text) { inp.focus(); return; }
    const c = CONVS[current];
    const m = { who: 'out', text, time: now() };
    c.msgs.push(m);
    thread.appendChild(bubble(m));
    inp.value = ''; syncFilled(inp);
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    const conv = current;
    const typing = bubble({ who: 'in', text: 'Escribiendo…', typing: true });
    setTimeout(() => {
      if (conv !== current) return;
      thread.appendChild(typing);
      chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    }, 700);
    setTimeout(() => {
      typing.remove();
      const r = { who: 'in', text: c.replies[(c.msgs.length) % c.replies.length], time: now() };
      c.msgs.push(r);
      if (conv === current) {
        thread.appendChild(bubble(r));
        chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
      }
    }, 2200);
  }
  const compose = $('#s-mensajes .compose');
  if (compose) compose.addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
  $$('input[type=file][data-chat]').forEach(inp => inp.addEventListener('change', () => {
    if (!inp.files.length) return;
    const c = CONVS[current];
    const m = { who: 'out', text: '📎 ' + Array.from(inp.files).map(f => f.name).join(', '), time: now() };
    c.msgs.push(m);
    thread.appendChild(bubble(m));
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    inp.value = '';
  }));

  /* ---------------- teclado: Enter/Espacio en controles ---------------- */
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.date')) { e.preventDefault(); openDate(e.target); }
  });

  /* ---------------- inicio ---------------- */
  $$('.ctl').forEach(c => c.classList.toggle('diff', c.dataset.sel !== undefined && c.dataset.sel !== c.dataset.baked && !c.classList.contains('save')));
  window.addEventListener('resize', fit);
  fit();
  show(location.hash.replace(/^#\/?/, '') || 'inicio', true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateSticky);
})();
