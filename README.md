# Vertex Sovereign Diagnostic™ — web demo

A self-contained, browser-only demo of the Vertex Sovereign Diagnostic. No server,
no build step, no dependencies — every page is plain HTML/CSS/JS and runs entirely
in the visitor's browser. Any static host (GitHub Pages, Vercel, Netlify) can serve it.

## What it does
Landing → simulated checkout → a 25-question diagnostic → a personalised on-screen
report (Sovereign Score, 7-dimension map, screening flags, interaction insights,
priority risks, and a strategy-call invitation).

## Notes
- **Nothing is live:** no real payment is taken, no card data is stored, no email is sent.
- **Sessions** are saved in each visitor's own browser (localStorage), which is why the
  "Sessions" list only shows runs done on that device/browser.
- The scoring and report logic lives in `js/scoring.js`; it is deterministic.
- This is a demonstration for review, not a production system, and not legal/tax/financial advice.

## Run locally
Open `index.html` in a browser, or serve the folder:
`python -m http.server 8080` then visit http://localhost:8080
