(function () {
  const listEl = document.getElementById('combat-list');
  const nameInput = document.getElementById('combat-name');
  const initInput = document.getElementById('combat-init');
  const hpInput = document.getElementById('combat-hp');
  const addBtn = document.getElementById('combat-add');
  const nextBtn = document.getElementById('combat-next');
  const clearBtn = document.getElementById('combat-clear');
  const roundEl = document.getElementById('combat-round');

  let combatants = [];
  let currentIndex = 0;
  let round = 1;

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';
    combatants.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'combat-item' + (i === currentIndex ? ' active' : '');
      const hpPct = Math.max(0, Math.min(100, (c.hp / c.hpMax) * 100));
      li.innerHTML = `
        <span class="init">${c.init}</span>
        <span class="name">${c.name}</span>
        <div class="hp-bar" title="${c.hp}/${c.hpMax}">
          <div class="hp-bar-fill" style="width:${hpPct}%"></div>
        </div>
        <span class="text-muted" style="min-width:50px;font-size:0.85rem">${c.hp}/${c.hpMax}</span>
        <button type="button" class="btn btn-sm btn-ghost dmg-btn" data-i="${i}">-1</button>
        <button type="button" class="btn btn-sm btn-ghost heal-btn" data-i="${i}">+1</button>
        <button type="button" class="btn btn-sm btn-ghost remove-btn" data-i="${i}">×</button>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('.dmg-btn').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.i);
        combatants[i].hp = Math.max(0, combatants[i].hp - 1);
        render();
      });
    });
    listEl.querySelectorAll('.heal-btn').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.i);
        combatants[i].hp = Math.min(combatants[i].hpMax, combatants[i].hp + 1);
        render();
      });
    });
    listEl.querySelectorAll('.remove-btn').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.i);
        combatants.splice(i, 1);
        if (currentIndex >= combatants.length) currentIndex = 0;
        render();
      });
    });

    if (roundEl) roundEl.textContent = 'Rodada ' + round;
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = (nameInput && nameInput.value.trim()) || 'Combatente';
      const init = parseInt(initInput && initInput.value) || 0;
      const hp = parseInt(hpInput && hpInput.value) || 10;
      combatants.push({ name, init, hp, hpMax: hp });
      combatants.sort((a, b) => b.init - a.init);
      if (nameInput) nameInput.value = '';
      if (initInput) initInput.value = '';
      if (hpInput) hpInput.value = '';
      render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (combatants.length === 0) return;
      currentIndex++;
      if (currentIndex >= combatants.length) {
        currentIndex = 0;
        round++;
      }
      render();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      combatants = [];
      currentIndex = 0;
      round = 1;
      render();
    });
  }

  render();
})();
