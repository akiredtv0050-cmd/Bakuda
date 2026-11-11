/* ==========================================================
   ui.js  ―  画面切りかえ・ポップアップ・確認ダイアログ・画像の代用表示
   ========================================================== */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const byId = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('ja-JP');

/* ---------- 画像：無いときは絵文字で代用（2000枚がそろうまでの保険） ---------- */
const Img = {
  missing: new Set(),
  /* HTML文字列で使う */
  html(src, fallback, cls) {
    const fb = esc(fallback || '❓');
    if (!src || this.missing.has(src)) return `<span class="img-fb ${cls || ''}">${fb}</span>`;
    return `<img class="${cls || ''}" src="${esc(src)}" alt="" loading="lazy" decoding="async" draggable="false" data-fb="${fb}" onerror="Img.fail(this)">`;
  },
  fail(el) {
    this.missing.add(el.getAttribute('src'));
    const sp = document.createElement('span');
    sp.className = 'img-fb ' + (el.className || '');
    sp.textContent = el.dataset.fb || '❓';
    el.replaceWith(sp);
  }
};

/* ---------- 画面とポップアップ ---------- */
const UI = {
  current: 'title',
  show(name) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = byId(`${name}-screen`);
    if (el) el.classList.add('active');
    this.current = name;
  },
  open(id) {
    const el = byId(id); if (!el) return;
    el.classList.add('open');
    Audio2.se('open');
  },
  close(id, silent) {
    const el = byId(id); if (!el) return;
    el.classList.remove('open');
    if (!silent) Audio2.se('close');
  },
  isOpen(id) { const el = byId(id); return !!(el && el.classList.contains('open')); },

  /* 確認ダイアログ（alert / confirm の代わり。子供にもやさしい見た目）
     UI.confirm({ title, html, ok:'つくる', cancel:'やめる', img }) → Promise<true/false> */
  confirm(opt) {
    return new Promise(resolve => {
      const box = byId('dialog-modal');
      byId('dialog-title').textContent = opt.title || '';
      byId('dialog-body').innerHTML = opt.html || '';
      const okBtn = byId('dialog-ok'), cancelBtn = byId('dialog-cancel');
      okBtn.textContent = opt.ok || 'OK';
      okBtn.className = 'btn-rpg ' + (opt.danger ? 'is-red' : 'is-orange');
      cancelBtn.textContent = opt.cancel || 'やめる';
      cancelBtn.style.display = opt.cancel === false ? 'none' : '';
      const done = (v) => { box.classList.remove('open'); okBtn.onclick = cancelBtn.onclick = null; Audio2.se(v ? 'tap' : 'close'); resolve(v); };
      okBtn.onclick = () => done(true);
      cancelBtn.onclick = () => done(false);
      box.classList.add('open');
      Audio2.se('open');
    });
  },
  alert(title, html) { return this.confirm({ title, html, ok: 'OK', cancel: false }); },

  /* えらぶリスト（図鑑・もちもの の「エリアえらび」などで共通）
     UI.pick({ title, rows:[{ key, label, sub, active, done }], onPick(key) }) */
  pick(opt) {
    byId('zukan-pick-title').textContent = opt.title || '';
    const list = byId('zukan-pick-list');
    list.innerHTML = opt.rows.map(r => `<button class="zukan-pick-row ${r.active ? 'active' : ''} ${r.done ? 'done' : ''}" data-k="${esc(r.key)}">
      <span>${r.label}</span><small>${r.sub || ''}</small></button>`).join('');
    $$('.zukan-pick-row', list).forEach(b => b.onclick = () => { this.close('zukan-pick-modal', true); Audio2.se('change'); opt.onPick(b.dataset.k); });
    this.open('zukan-pick-modal');
    const act = $('.zukan-pick-row.active', list);
    if (act) act.scrollIntoView({ block: 'center' });
  },

  /* 画像を大きく見る */
  zoom(src, caption) {
    if (!src || Img.missing.has(src)) return;
    byId('zoom-img').src = src;
    byId('zoom-caption').textContent = caption || '';
    this.open('zoom-modal');
  },

  /* ふわっと出る数字（ダメージなど） */
  popText(parent, text, x, y, cls) {
    const el = document.createElement('div');
    el.className = 'pop-text ' + (cls || '');
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    parent.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
};

/* ---------- 横にスライドできる列（種類チップなど） ----------
   ・スマホ：指でスワイプ ・PC：マウスでドラッグ / ホイール ・左右の ‹ › ボタン */
UI.slider = function (row) {
  if (!row || row._slider) return;
  row._slider = true;
  const wrap = row.parentElement && row.parentElement.classList.contains('chip-scroller') ? row.parentElement : null;
  let down = null, moved = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;                 // タッチは標準のスクロールにまかせる
    down = { x: e.clientX, sl: row.scrollLeft }; moved = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 5) { moved = true; row.classList.add('dragging'); }
    if (moved) row.scrollLeft = down.sl - dx;
  });
  window.addEventListener('pointerup', () => { down = null; setTimeout(() => row.classList.remove('dragging'), 0); });
  row.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { row.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
  if (wrap) {
    const L = wrap.querySelector('.chip-arrow.left'), R = wrap.querySelector('.chip-arrow.right');
    const upd = () => {
      L.classList.toggle('off', row.scrollLeft <= 2);
      R.classList.toggle('off', row.scrollLeft + row.clientWidth >= row.scrollWidth - 2);
      wrap.classList.toggle('no-overflow', row.scrollWidth <= row.clientWidth + 2);
    };
    L.onclick = () => row.scrollBy({ left: -row.clientWidth * 0.7, behavior: 'smooth' });
    R.onclick = () => row.scrollBy({ left: row.clientWidth * 0.7, behavior: 'smooth' });
    row.addEventListener('scroll', upd, { passive: true });
    row._sliderUpdate = upd;
    new MutationObserver(() => requestAnimationFrame(upd)).observe(row, { childList: true });
    window.addEventListener('resize', upd);
    requestAnimationFrame(upd);
  }
};

/* 共通：data-close="モーダルID" のボタンで閉じる / data-zoom で拡大 */
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-close]');
  if (c) { UI.close(c.dataset.close); return; }
  const z = e.target.closest('img[data-zoom]');
  if (z) UI.zoom(z.getAttribute('src'), z.dataset.zoom);
});
