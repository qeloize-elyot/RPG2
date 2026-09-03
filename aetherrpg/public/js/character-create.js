(function () {
  // ---------- Steps ----------
  function showStep(n) {
    document.querySelectorAll('.step-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.step === String(n));
    });
    document.querySelectorAll('.step-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.step === String(n));
    });
    if (n === 4) buildSummary();
  }
  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => showStep(btn.dataset.next));
  });
  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => showStep(btn.dataset.prev));
  });
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(btn.dataset.step));
  });

  // ---------- Attributes (Ordem Paranormal) ----------
  const attrs = ['agi', 'for', 'int', 'pre', 'vig'];
  const base = 1; // each starts at 1

  function getPool() {
    return parseInt(document.getElementById('point-pool').value, 10) || 0;
  }
  function getMax() {
    return parseInt(document.getElementById('attr-max').value, 10) || 3;
  }
  function spentPoints() {
    let s = 0;
    attrs.forEach(a => {
      const v = parseInt(document.getElementById(a).value, 10) || base;
      s += (v - base);
    });
    return s;
  }
  function updatePointsLeft() {
    const left = getPool() - spentPoints();
    const el = document.getElementById('points-left');
    if (el) {
      el.textContent = left;
      el.style.color = left < 0 ? 'var(--crimson-bright)' : 'var(--gold)';
    }
  }
  function setAttr(id, val) {
    const max = getMax();
    val = Math.max(0, Math.min(max, val));
    document.getElementById(id).value = val;
    updatePointsLeft();
  }

  document.querySelectorAll('.attr-card').forEach(card => {
    const id = card.dataset.attr;
    const input = document.getElementById(id);
    card.querySelector('.plus').addEventListener('click', () => {
      const cur = parseInt(input.value, 10) || 0;
      const left = getPool() - spentPoints();
      if (left <= 0 && cur >= base) return;
      if (cur >= getMax()) return;
      setAttr(id, cur + 1);
    });
    card.querySelector('.minus').addEventListener('click', () => {
      const cur = parseInt(input.value, 10) || 0;
      if (cur <= 0) return;
      setAttr(id, cur - 1);
    });
  });
  document.getElementById('point-pool').addEventListener('input', updatePointsLeft);
  document.getElementById('attr-max').addEventListener('input', () => {
    attrs.forEach(a => {
      const v = parseInt(document.getElementById(a).value, 10);
      if (v > getMax()) setAttr(a, getMax());
    });
    updatePointsLeft();
  });
  updatePointsLeft();

  // ---------- Avatar 2D (layered, no emojis) ----------
  // Catalog: expandable. Use CSS shapes / gradients for clean look.
  // Later: replace with real PNG paths in /img/avatar/...
  const CATALOG = {
    skin: [
      { id: 'skin1', label: 'Tom 1', style: { background: 'radial-gradient(ellipse at 50% 40%, #e8c4a8 0%, #c4a484 70%)' } },
      { id: 'skin2', label: 'Tom 2', style: { background: 'radial-gradient(ellipse at 50% 40%, #d4a574 0%, #a67c52 70%)' } },
      { id: 'skin3', label: 'Tom 3', style: { background: 'radial-gradient(ellipse at 50% 40%, #8d5524 0%, #5c3a1a 70%)' } },
      { id: 'skin4', label: 'Tom 4', style: { background: 'radial-gradient(ellipse at 50% 40%, #f5d0b0 0%, #e0b090 70%)' } },
      { id: 'skin5', label: 'Tom 5', style: { background: 'radial-gradient(ellipse at 50% 40%, #6b4423 0%, #3d2814 70%)' } }
    ],
    hair: [
      { id: 'none', label: 'Nenhum', style: { background: 'none' } },
      { id: 'hair1', label: 'Curto', style: { background: 'radial-gradient(ellipse at 50% 20%, currentColor 0%, transparent 55%)' } },
      { id: 'hair2', label: 'Médio', style: { background: 'radial-gradient(ellipse at 50% 15%, currentColor 0%, transparent 60%)' } },
      { id: 'hair3', label: 'Longo', style: { background: 'linear-gradient(180deg, currentColor 0%, currentColor 35%, transparent 70%)' } },
      { id: 'hair4', label: 'Raspado', style: { background: 'radial-gradient(ellipse at 50% 18%, currentColor 0%, transparent 35%)' } },
      { id: 'hair5', label: 'Coque', style: { background: 'radial-gradient(circle at 50% 12%, currentColor 0%, transparent 28%)' } },
      { id: 'hair6', label: 'Lateral', style: { background: 'linear-gradient(90deg, currentColor 0%, transparent 40%, transparent 60%, currentColor 100%)' } }
    ],
    eyes: [
      { id: 'eyes1', label: 'Normais', style: { background: 'radial-gradient(circle at 35% 42%, #fff 0 4px, transparent 5px), radial-gradient(circle at 65% 42%, #fff 0 4px, transparent 5px)' } },
      { id: 'eyes2', label: 'Estreitos', style: { background: 'radial-gradient(ellipse at 35% 42%, #fff 0 3px, transparent 4px), radial-gradient(ellipse at 65% 42%, #fff 0 3px, transparent 4px)' } },
      { id: 'eyes3', label: 'Grandes', style: { background: 'radial-gradient(circle at 35% 42%, #fff 0 6px, transparent 7px), radial-gradient(circle at 65% 42%, #fff 0 6px, transparent 7px)' } }
    ],
    top: [
      { id: 'none', label: 'Nenhum', style: { background: 'none' } },
      { id: 'top1', label: 'Camisa', style: { background: 'linear-gradient(180deg, transparent 35%, #3a3a4a 36%, #3a3a4a 70%, transparent 71%)' } },
      { id: 'top2', label: 'Casaco', style: { background: 'linear-gradient(180deg, transparent 32%, #1a1a28 33%, #1a1a28 75%, transparent 76%)' } },
      { id: 'top3', label: 'Colete', style: { background: 'linear-gradient(180deg, transparent 38%, #4a2c2c 39%, #4a2c2c 68%, transparent 69%)' } },
      { id: 'top4', label: 'Jaqueta', style: { background: 'linear-gradient(180deg, transparent 30%, #2a2030 31%, #2a2030 72%, transparent 73%)' } },
      { id: 'top5', label: 'Regata', style: { background: 'linear-gradient(180deg, transparent 40%, #333 41%, #333 62%, transparent 63%)' } }
    ],
    bottom: [
      { id: 'none', label: 'Nenhum', style: { background: 'none' } },
      { id: 'bot1', label: 'Calça', style: { background: 'linear-gradient(180deg, transparent 58%, #2a2a35 59%, #2a2a35 92%, transparent 93%)' } },
      { id: 'bot2', label: 'Jeans', style: { background: 'linear-gradient(180deg, transparent 58%, #3a4a5a 59%, #3a4a5a 92%, transparent 93%)' } },
      { id: 'bot3', label: 'Saia', style: { background: 'linear-gradient(180deg, transparent 58%, #4a3040 59%, #4a3040 85%, transparent 86%)' } },
      { id: 'bot4', label: 'Shorts', style: { background: 'linear-gradient(180deg, transparent 58%, #333 59%, #333 78%, transparent 79%)' } }
    ],
    shoes: [
      { id: 'none', label: 'Nenhum', style: { background: 'none' } },
      { id: 'sh1', label: 'Tênis', style: { background: 'linear-gradient(180deg, transparent 88%, #ddd 89%, #ddd 96%, transparent 97%)' } },
      { id: 'sh2', label: 'Bota', style: { background: 'linear-gradient(180deg, transparent 85%, #222 86%, #222 97%, transparent 98%)' } },
      { id: 'sh3', label: 'Social', style: { background: 'linear-gradient(180deg, transparent 90%, #1a1a1a 91%, #1a1a1a 96%, transparent 97%)' } }
    ],
    accessory: [
      { id: 'none', label: 'Nenhum', style: { background: 'none' } },
      { id: 'acc1', label: 'Óculos', style: { background: 'linear-gradient(180deg, transparent 38%, transparent 38%), radial-gradient(circle at 35% 42%, transparent 0 8px, #222 8px 9px, transparent 10px), radial-gradient(circle at 65% 42%, transparent 0 8px, #222 8px 9px, transparent 10px)' } },
      { id: 'acc2', label: 'Colar', style: { background: 'radial-gradient(circle at 50% 52%, #c9a227 0 3px, transparent 4px)' } },
      { id: 'acc3', label: 'Máscara', style: { background: 'linear-gradient(180deg, transparent 40%, rgba(20,20,30,.7) 41%, rgba(20,20,30,.7) 55%, transparent 56%)' } },
      { id: 'acc4', label: 'Brinco', style: { background: 'radial-gradient(circle at 22% 48%, #c9a227 0 2px, transparent 3px), radial-gradient(circle at 78% 48%, #c9a227 0 2px, transparent 3px)' } }
    ]
  };

  const state = {
    skin: 'skin1',
    hair: 'hair1',
    eyes: 'eyes1',
    top: 'top1',
    bottom: 'bot1',
    shoes: 'sh1',
    accessory: 'none',
    skinColor: '#c4a484',
    hairColor: '#2b1d14',
    eyeColor: '#3a5a7a'
  };

  function applyLayer(cat, itemId) {
    const layer = document.getElementById('layer-' + (cat === 'bottom' ? 'bottom' : cat));
    if (!layer) return;
    const list = CATALOG[cat] || [];
    const item = list.find(i => i.id === itemId) || list[0];
    if (!item) return;
    Object.assign(layer.style, {
      background: 'none',
      backgroundImage: '',
      backgroundColor: 'transparent'
    });
    if (item.style && item.style.background) {
      layer.style.background = item.style.background;
    }
    if (cat === 'skin') {
      layer.style.background = item.style.background || state.skinColor;
      // tint with color picker roughly
      layer.style.filter = 'none';
    }
    if (cat === 'hair') {
      layer.style.color = state.hairColor;
      if (item.id !== 'none') {
        layer.style.background = item.style.background;
        layer.style.color = state.hairColor;
      }
    }
    if (cat === 'eyes') {
      layer.style.background = item.style.background;
    }
    state[cat] = itemId;
    syncAppearanceJson();
  }

  function renderOptions(cat) {
    const box = document.getElementById('av-options');
    if (!box) return;
    const list = CATALOG[cat] || [];
    box.innerHTML = '';
    list.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'av-option' + (item.id === 'none' ? ' none' : '') + (state[cat] === item.id ? ' selected' : '');
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        applyLayer(cat, item.id);
        renderOptions(cat);
      });
      box.appendChild(btn);
    });
  }

  document.querySelectorAll('.av-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.av-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderOptions(tab.dataset.cat);
    });
  });

  function syncAppearanceJson() {
    const hidden = document.getElementById('appearance-json');
    if (hidden) hidden.value = JSON.stringify(state);
  }

  document.getElementById('skin-color').addEventListener('input', e => {
    state.skinColor = e.target.value;
    applyLayer('skin', state.skin);
  });
  document.getElementById('hair-color').addEventListener('input', e => {
    state.hairColor = e.target.value;
    applyLayer('hair', state.hair);
  });
  document.getElementById('eye-color').addEventListener('input', e => {
    state.eyeColor = e.target.value;
  });

  // init layers
  ['skin', 'hair', 'eyes', 'top', 'bottom', 'shoes', 'accessory'].forEach(c => {
    if (state[c]) applyLayer(c, state[c]);
  });
  renderOptions('skin');
  syncAppearanceJson();

  // ---------- Summary ----------
  function buildSummary() {
    const box = document.getElementById('summary-box');
    if (!box) return;
    const name = document.getElementById('name').value || '—';
    const concept = document.getElementById('concept').value || '—';
    const origin = document.getElementById('origin').value || '—';
    const cls = document.getElementById('class').value || '—';
    const nex = document.getElementById('nex').value || '5';
    const a = {};
    attrs.forEach(k => { a[k] = document.getElementById(k).value; });
    box.innerHTML = `
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>Conceito:</strong> ${escapeHtml(concept)}</p>
      <p><strong>Origem:</strong> ${escapeHtml(origin)} · <strong>Classe:</strong> ${escapeHtml(cls)} · <strong>NEX:</strong> ${escapeHtml(nex)}%</p>
      <p><strong>Atributos:</strong>
        AGI ${a.agi} · FOR ${a.for} · INT ${a.int} · PRE ${a.pre} · VIG ${a.vig}
      </p>
      <p class="text-muted" style="font-size:0.85rem;margin-top:0.5rem">Aparência 2D será salva com a ficha.</p>
    `;
  }
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
