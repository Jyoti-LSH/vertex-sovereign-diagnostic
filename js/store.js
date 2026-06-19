/* Vertex Sovereign Diagnostic - client-side session store (localStorage).
   Replaces the Flask backend for the static, shareable build. Each visitor's
   sessions live in their own browser. Exposes window.VertexStore. */
(function () {
  "use strict";
  const PREFIX = "vgs_session_";

  function pad(n) { return String(n).padStart(2, "0"); }

  function newId() {
    const d = new Date();
    const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    const rand = Math.random().toString(36).slice(2, 6);
    return stamp + "-" + rand;
  }

  function prettyWhen(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"}) +
        ", " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    } catch (e) { return iso; }
  }

  function save(s) { localStorage.setItem(PREFIX + s.id, JSON.stringify(s)); }
  function load(id) { const v = localStorage.getItem(PREFIX + id); return v ? JSON.parse(v) : null; }

  function createSession(email) {
    const id = newId();
    const now = new Date().toISOString();
    const s = {
      id: id, createdAt: now, name: "Untitled diagnostic — " + prettyWhen(now),
      customerEmail: (email || "").trim(), status: "paid", answers: null, report: null,
    };
    save(s);
    return id;
  }

  function submit(id, answers) {
    const s = load(id);
    if (!s) return null;
    const report = window.Scoring.compute(answers);
    report.ref = ("VGA-" + id.split("-").pop()).toUpperCase();
    report.prepared = new Date().toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric"});
    s.answers = answers;
    s.report = report;
    s.status = "report_generated";
    s.completedAt = new Date().toISOString();
    if (s.name.indexOf("Untitled diagnostic") === 0) {
      const who = report.first_name || "Client";
      s.name = who.charAt(0).toUpperCase() + who.slice(1) + " — " + report.overall_band + " (" + report.sovereign_score + ")";
    }
    save(s);
    return s;
  }

  function getSession(id) { return load(id); }

  function listSessions() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) {
        try {
          const s = JSON.parse(localStorage.getItem(k));
          const rep = s.report || {};
          items.push({
            id: s.id, name: s.name, createdAt: s.createdAt, createdAtPretty: prettyWhen(s.createdAt),
            email: s.customerEmail, status: s.status, score: rep.sovereign_score, band: rep.overall_band,
          });
        } catch (e) {}
      }
    }
    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return items;
  }

  function rename(id, name) {
    const s = load(id);
    if (!s) return null;
    name = (name || "").trim();
    if (name) { s.name = name; save(s); }
    return s.name;
  }

  window.VertexStore = {createSession, submit, getSession, listSessions, rename};
})();
