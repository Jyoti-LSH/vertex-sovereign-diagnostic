// Vertex Sovereign Diagnostic - questionnaire flow (static build: Scoring + VertexStore)
(function () {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('id');
  if (!sessionId || !window.VertexStore.getSession(sessionId)) { location.href = 'index.html'; return; }

  const questions = window.Scoring.QUESTIONS;
  let idx = 0;
  const answers = {};

  const elCard = document.getElementById('q-card');
  const elLabel = document.getElementById('step-label');
  const elBar = document.getElementById('bar');
  const elNext = document.getElementById('next-btn');
  const elBack = document.getElementById('back-btn');
  const elQuiz = document.getElementById('quiz');
  const elProc = document.getElementById('processing');
  const elProcMsg = document.getElementById('proc-msg');

  function visible(q) { return !q.show_if || answers[q.show_if.q] === q.show_if.eq; }
  function visibleCount() { return questions.filter(visible).length; }
  function visiblePos(upTo) { let n = 0; for (let i = 0; i <= upTo; i++) if (visible(questions[i])) n++; return n; }

  function render() {
    const q = questions[idx];
    const pos = visiblePos(idx), total = visibleCount();
    elLabel.textContent = `Step ${pos} of ${total} — ${q.section}`;
    elBar.style.width = ((pos - 1) / total * 100) + '%';

    let html = `<h2>${esc(q.question)}</h2>`;
    if (q.help) html += `<p class="q-help">${esc(q.help)}</p>`;
    if (q.type === 'text') {
      html += `<input class="text-input" id="text-in" placeholder="${esc(q.placeholder || '')}" value="${esc(answers[q.id] || '')}">`;
    } else if (q.type === 'multi') {
      const chosen = answers[q.id] || [];
      html += `<div class="options">`;
      q.options.forEach(o => { html += `<div class="opt checkbox${chosen.includes(o.value) ? ' selected' : ''}" data-multi="${o.value}"><span class="mark"></span><span class="opt-text">${esc(o.label)}</span></div>`; });
      html += `</div>`;
    } else {
      html += `<div class="options">`;
      q.options.forEach(o => { html += `<div class="opt${answers[q.id] === o.value ? ' selected' : ''}" data-val="${o.value}"><span class="mark"></span><span class="opt-text">${esc(o.label)}</span></div>`; });
      html += `</div>`;
    }
    elCard.innerHTML = html;
    elBack.style.visibility = pos === 1 ? 'hidden' : 'visible';
    elNext.textContent = (pos === total) ? 'See my Sovereign Score →' : 'Continue →';
    wire(q); refreshNext(q);
  }

  function wire(q) {
    if (q.type === 'text') {
      const inp = document.getElementById('text-in'); inp.focus();
      inp.addEventListener('input', () => { answers[q.id] = inp.value.trim(); refreshNext(q); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !elNext.disabled) goNext(); });
      return;
    }
    if (q.type === 'multi') {
      elCard.querySelectorAll('.opt[data-multi]').forEach(el => {
        el.addEventListener('click', () => {
          const v = el.dataset.multi, none = (v === 'none');
          el.classList.toggle('selected');
          if (none && el.classList.contains('selected')) elCard.querySelectorAll('.opt[data-multi]').forEach(o => { if (o !== el) o.classList.remove('selected'); });
          else if (!none) { const ne = elCard.querySelector('.opt[data-multi="none"]'); if (ne) ne.classList.remove('selected'); }
          answers[q.id] = Array.from(elCard.querySelectorAll('.opt[data-multi].selected')).map(o => o.dataset.multi);
          refreshNext(q);
        });
      });
      return;
    }
    elCard.querySelectorAll('.opt[data-val]').forEach(el => {
      el.addEventListener('click', () => {
        elCard.querySelectorAll('.opt[data-val]').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected'); answers[q.id] = el.dataset.val; refreshNext(q);
      });
    });
  }

  function refreshNext(q) {
    let ok;
    if (q.type === 'text' || q.type === 'multi') ok = !!(answers[q.id] && answers[q.id].length);
    else ok = !!answers[q.id];
    elNext.disabled = !ok;
  }

  function goNext() {
    let j = idx + 1; while (j < questions.length && !visible(questions[j])) j++;
    if (j < questions.length) { idx = j; render(); window.scrollTo({top: 0, behavior: 'smooth'}); }
    else submit();
  }
  function goBack() {
    let j = idx - 1; while (j > 0 && !visible(questions[j])) j--;
    if (j >= 0) { idx = j; render(); window.scrollTo({top: 0, behavior: 'smooth'}); }
  }
  elNext.addEventListener('click', goNext);
  elBack.addEventListener('click', goBack);

  function submit() {
    elQuiz.style.display = 'none'; elProc.style.display = 'block';
    const msgs = ['Analysing your global footprint…', 'Cross-checking your answers…', 'Calculating your Sovereign Score…', 'Preparing your diagnostic…'];
    let i = 0; const cycle = setInterval(() => { i = (i + 1) % msgs.length; elProcMsg.textContent = msgs[i]; }, 1100);
    setTimeout(() => {
      try {
        window.VertexStore.submit(sessionId, answers);
        clearInterval(cycle);
        location.href = 'results.html?id=' + encodeURIComponent(sessionId);
      } catch (e) { clearInterval(cycle); alert('Could not generate the report.'); }
    }, 2600);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }

  render();
})();
