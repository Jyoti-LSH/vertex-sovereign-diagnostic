// Vertex Sovereign Diagnostic - render the report (static build: reads VertexStore)
(function () {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('id');
  const root = document.getElementById('report').querySelector('.wrap');
  if (!sessionId) { location.href = 'index.html'; return; }

  const s = window.VertexStore.getSession(sessionId);
  if (!s) { root.innerHTML = '<p class="muted center">Report not found.</p>'; return; }
  if (!s.report) { location.href = 'diagnostic.html?id=' + encodeURIComponent(sessionId); return; }
  render(s);

  function render(s) {
    const rep = s.report;
    const dims = rep.dimension_order.map(id => rep.scores[id]);
    const ref = rep.ref || ('VGA-' + sessionId.slice(-6)).toUpperCase();
    const date = rep.prepared || (s.completedAt || s.createdAt || '').slice(0, 10);
    const insights = rep.interactions || [];
    const hero = insights.length ? insights[0] : null;
    const rest = insights.length > 1 ? insights.slice(1) : [];

    let h = '';
    h += `<div class="cover">
      <div class="eyebrow">Vertex Sovereign Diagnostic™</div>
      <h1>Prepared for ${esc(cap(rep.first_name))}</h1>
      <p class="cover-meta">${esc(date)} &nbsp;·&nbsp; Ref ${esc(ref)} &nbsp;·&nbsp; <span class="confidential">Strictly Private &amp; Confidential</span></p>
      <p class="methodology">${esc(rep.methodology)}</p>
    </div>`;

    h += `<h2>Executive summary</h2><p class="muted lead">${md(rep.exec_summary)}</p>`;

    if (hero) {
      h += `<div class="hero-insight">
        <div class="eyebrow">A closer look — the thing most people miss</div>
        <h3>${esc(hero.title)}</h3><p>${esc(hero.body)}</p></div>`;
    }

    h += `<div class="score-hero">
      <div class="score-badge"><b>${rep.sovereign_score}</b><span class="outof">/ 100</span></div>
      <div class="score-meta">
        <span class="band-pill">${esc(rep.overall_band)}</span>
        <p style="font-size:1.1rem;color:#fff;">${esc(rep.one_line)}</p>
        <p class="muted small">${esc(rep.positioning)}</p>
      </div></div>`;

    if (rep.screening_flags && rep.screening_flags.length) {
      h += `<div class="flagblock"><div class="eyebrow" style="color:#E0A33A;">Priority screening flags</div>
        <p class="muted small" style="margin-top:-6px;">Facts you raised that shape everything else — surfaced first, on purpose.</p>`;
      rep.screening_flags.forEach(f => {
        h += `<div class="flagcard"><div class="flag-top"><span class="flag-title">${esc(f.title)}</span><span class="flag-sev">${esc(f.severity)}</span></div>
          <div class="flag-mag">${esc(f.magnitude)}</div><p>${esc(f.note)}</p></div>`;
      });
      h += `</div>`;
    }

    h += `<div class="radar-wrap">${radarSVG(dims)}</div>`;
    if (rep.excluded && rep.excluded.length)
      h += `<p class="muted small center" style="margin-top:-6px;">Not applicable to you, and excluded from your score: ${esc(rep.excluded.join(', '))}.</p>`;

    h += `<hr class="divider"><h2>Risk heat map</h2>
      <table class="heat-table"><thead><tr><th>Dimension</th><th style="width:32%;">Score</th><th>Status</th></tr></thead><tbody>`;
    dims.forEach(d => {
      h += `<tr><td><div class="heat-name">${esc(d.name)}</div><div class="heat-sum">${esc(d.summary)}</div></td>
        <td><div class="bar"><i style="width:${d.score}%;background:${d.color};"></i></div><div class="muted small" style="margin-top:5px;">${d.score} / 100</div></td>
        <td><span class="status-badge" style="background:${d.color};">${esc(d.band_label)}</span></td></tr>`;
    });
    h += `</tbody></table>`;

    if (rest.length) {
      h += `<hr class="divider"><h2>What else your answers reveal</h2>`;
      rest.forEach(i => { h += `<div class="insight"><h4>${esc(i.title)}</h4><p>${esc(i.body)}</p></div>`; });
    }
    if (rep.pattern_note) h += `<div class="pattern"><div class="eyebrow">Pattern we see</div><p>${esc(rep.pattern_note)}</p></div>`;

    h += `<hr class="divider"><h2>Priority risks</h2>`;
    if (rep.top_risks && rep.top_risks.length) {
      h += `<p class="muted" style="margin-top:-6px;">The exposures that warrant attention first.</p>`;
      rep.top_risks.forEach(r => { h += `<div class="risk" style="border-left-color:${r.color};"><div class="dim">${esc(r.dimension)}</div><h4>${esc(r.title)}</h4><p>${esc(r.why)}</p></div>`; });
    } else {
      h += `<p class="muted">Nothing in your position scored into the risk range. That's a genuinely strong result — the value from here is maintenance, not repair.</p>`;
    }

    h += `<hr class="divider"><h2>Dimension analysis</h2>`;
    dims.forEach(d => {
      h += `<div class="analysis-block"><h3>${esc(d.name)} <span class="chip" style="background:${d.color};">${esc(d.band_label)} · ${d.score}</span></h3><p>${esc(d.analysis)}</p>`;
      if (d.takeaway) h += `<p class="takeaway"><b>First move:</b> ${esc(d.takeaway)}</p>`;
      if (d.stakes) h += `<p class="stakes">${esc(d.stakes)}</p>`;
      h += `</div>`;
    });

    if (rep.open_questions && rep.open_questions.length) {
      h += `<hr class="divider"><h2>The decisions worth a conversation</h2>`;
      if (rep.open_questions_lede) h += `<p class="muted" style="margin-top:-6px;">${esc(rep.open_questions_lede)}</p>`;
      h += `<ol class="openq">`; rep.open_questions.forEach(q => { h += `<li>${esc(q)}</li>`; }); h += `</ol>`;
    }

    const eng = rep.engagement || {};
    h += `<hr class="divider"><div class="cta-card cta-${esc(rep.cta.kind)}">
      <div class="eyebrow center">The next step</div>
      <p class="muted" style="max-width:620px;margin:0 auto 14px;">${esc(rep.strategic_note)}</p>
      <p style="color:#fff;font-size:1.05rem;max-width:620px;margin:0 auto 20px;">${esc(rep.cta.lede)}</p>`;
    if (eng.who) {
      const showPrice = rep.cta.kind !== 'stewardship';
      h += `<div class="engagement">
        <div class="eng-row"><span class="eng-k">Who</span><span class="eng-v">${esc(eng.who)}</span></div>
        <div class="eng-row"><span class="eng-k">Format</span><span class="eng-v">${esc(eng.format)}</span></div>
        <div class="eng-row"><span class="eng-k">You leave with</span><span class="eng-v">${esc(eng.deliverable)}</span></div>
        ${showPrice && eng.investment ? `<div class="eng-row"><span class="eng-k">Investment</span><span class="eng-v">${esc(eng.investment)}</span></div>` : ''}
        <div class="eng-reassure">${esc(eng.reassurance)}</div>
        ${showPrice && eng.price_anchor ? `<div class="eng-anchor">${esc(eng.price_anchor)}</div>` : ''}
      </div>`;
    }
    h += `<a href="#" class="btn btn-gold" onclick="alert('Demo: this would open the booking calendar.');return false;">${esc(rep.cta.label)} →</a>`;
    if (eng.bridge_line) h += `<p class="bridge-line">${esc(eng.bridge_line)}</p>`;
    h += `<p class="footnote" style="margin-top:14px;">A copy of this report would be sent to ${esc(s.customerEmail || 'your inbox')}.</p></div>`;

    h += `<div class="disclaimer"><b>Important.</b> ${esc(rep.disclaimer)}</div>`;
    h += `<p class="footnote center" style="margin-top:20px;"><a href="sessions.html">← View all saved sessions</a></p>`;

    root.innerHTML = h;
  }

  function radarSVG(dims) {
    const size = 380, cx = size / 2, cy = size / 2, R = 132, n = dims.length;
    if (n < 3) return '';
    const ang = i => (-Math.PI / 2) + i * (2 * Math.PI / n);
    const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
    let rings = '';
    [0.25, 0.5, 0.75, 1].forEach(f => { rings += `<polygon points="${dims.map((_, i) => pt(i, R * f).join(',')).join(' ')}" fill="none" stroke="#283246" stroke-width="1"/>`; });
    let spokes = '', labels = '';
    dims.forEach((d, i) => {
      const p = pt(i, R); spokes += `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#283246" stroke-width="1"/>`;
      const l = pt(i, R + 20); const anchor = Math.abs(l[0] - cx) < 8 ? 'middle' : (l[0] > cx ? 'start' : 'end');
      labels += `<text x="${l[0]}" y="${l[1] + 4}" fill="#9AA3B2" font-size="10.5" font-family="system-ui,sans-serif" text-anchor="${anchor}">${esc(d.name.split(' ')[0])}</text>`;
    });
    const poly = dims.map((d, i) => pt(i, R * (d.score / 100)).join(',')).join(' ');
    let dots = ''; dims.forEach((d, i) => { const p = pt(i, R * (d.score / 100)); dots += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${d.color}"/>`; });
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Sovereign radar">${rings}${spokes}<polygon points="${poly}" fill="rgba(201,168,76,0.16)" stroke="#C9A84C" stroke-width="2"/>${dots}${labels}</svg>`;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#EAECEF;">$1</strong>'); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
})();
