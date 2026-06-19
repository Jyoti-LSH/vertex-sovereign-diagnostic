// Vertex Sovereign Diagnostic - sessions list + inline rename (static build)
(function () {
  const rows = document.getElementById('rows');
  const empty = document.getElementById('empty');
  const BANDS = {'Critical Risk': '#C0392B', 'High Exposure': '#D4912B', 'Developing': '#3C6E9E', 'Sovereign': '#3F7A52'};

  const list = window.VertexStore.listSessions();
  if (!list.length) { rows.innerHTML = ''; empty.style.display = 'block'; return; }

  rows.innerHTML = list.map(s => {
    const done = s.status === 'report_generated';
    const band = s.band ? `<span class="mini-band" style="background:${BANDS[s.band] || '#283246'};">${esc(s.band)}</span>` : '<span class="muted small">—</span>';
    const score = (s.score != null) ? s.score : '—';
    const link = done ? `<a href="results.html?id=${encodeURIComponent(s.id)}">View report →</a>` : `<span class="muted small">Incomplete</span>`;
    return `<tr>
      <td><input class="sess-name" data-id="${esc(s.id)}" value="${esc(s.name || '')}"></td>
      <td class="muted small">${esc(s.createdAtPretty || '')}</td>
      <td class="muted">${score}</td>
      <td>${band}</td>
      <td class="muted small">${esc(s.email || '')}</td>
      <td>${link}</td></tr>`;
  }).join('');

  rows.querySelectorAll('.sess-name').forEach(inp => {
    const save = () => { window.VertexStore.rename(inp.dataset.id, inp.value.trim()); flash(inp); };
    inp.addEventListener('blur', save);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  });

  function flash(el) { el.style.borderColor = '#3F7A52'; setTimeout(() => { el.style.borderColor = 'transparent'; }, 700); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
})();
