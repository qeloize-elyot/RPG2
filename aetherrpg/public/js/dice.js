(function () {
  const resultEl = document.getElementById('dice-result');
  const detailEl = document.getElementById('dice-detail');
  const historyEl = document.getElementById('dice-history');
  const formulaInput = document.getElementById('custom-formula');

  function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function parseAndRoll(formula) {
    // Simple parser: NdS+M or NdS-M or just NdS
    const cleaned = formula.replace(/\s/g, '').toLowerCase();
    const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) return null;

    const count = parseInt(match[1] || '1', 10);
    const sides = parseInt(match[2], 10);
    const mod = match[3] ? parseInt(match[3], 10) : 0;

    if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;

    const rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(rollDie(sides));
    }
    const sum = rolls.reduce((a, b) => a + b, 0) + mod;
    return { rolls, mod, total: sum, formula: cleaned };
  }

  function showResult(data) {
    if (!resultEl) return;
    resultEl.textContent = data.total;
    let detail = data.rolls.join(' + ');
    if (data.mod !== 0) {
      detail += (data.mod > 0 ? ' + ' : ' - ') + Math.abs(data.mod);
    }
    detail += ' = ' + data.total;
    if (detailEl) detailEl.textContent = detail;

    if (historyEl) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="text-muted">${data.formula}</span> → <strong>${data.total}</strong>`;
      historyEl.insertBefore(li, historyEl.firstChild);
      if (historyEl.children.length > 20) {
        historyEl.removeChild(historyEl.lastChild);
      }
    }

    // Optional save to server
    fetch('/api/roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formula: data.formula,
        result: data.rolls.join(','),
        total: data.total
      })
    }).catch(() => {});
  }

  document.querySelectorAll('.dice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.dataset.sides, 10);
      const data = parseAndRoll('1d' + sides);
      if (data) showResult(data);
    });
  });

  const rollCustom = document.getElementById('roll-custom');
  if (rollCustom) {
    rollCustom.addEventListener('click', () => {
      const formula = formulaInput ? formulaInput.value.trim() : '';
      if (!formula) return;
      const data = parseAndRoll(formula);
      if (data) {
        showResult(data);
      } else if (resultEl) {
        resultEl.textContent = '?';
        if (detailEl) detailEl.textContent = 'Fórmula inválida. Use ex: 2d6+3, 1d20, 4d8-1';
      }
    });
  }

  if (formulaInput) {
    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        rollCustom && rollCustom.click();
      }
    });
  }
})();
