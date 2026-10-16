const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA = process.env.DATA_FILE || path.join(__dirname, 'data', 'interest.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me';
fs.mkdirSync(path.dirname(DATA), { recursive: true });
function load() { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) { return []; } }
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.post('/api/interest', (req, res) => {
  const b = req.body || {};
  const clean = s => String(s || '').slice(0, 500);
  if (!clean(b.name).trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean(b.email))) return res.status(400).json({ ok: false });
  const row = { at: new Date().toISOString(), name: clean(b.name), email: clean(b.email), city: clean(b.city), phone: clean(b.phone), kind: clean(b.kind), seats: clean(b.seats), when: clean(b.when), msg: clean(b.msg) };
  const rows = load(); rows.push(row);
  fs.writeFileSync(DATA, JSON.stringify(rows, null, 2));
  console.log('INTEREST', JSON.stringify(row));
  res.json({ ok: true, count: rows.length });
});
app.get('/admin', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).send('Forbidden');
  const rows = load();
  if (req.query.format === 'csv') {
    const cols = ['at','name','email','city','phone','kind','seats','when','msg'];
    const esc = v => '"' + String(v || '').replace(/"/g, '""') + '"';
    res.type('text/csv').attachment('juddster-interest.csv');
    return res.send([cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(','))).join('\n'));
  }
  const esc = v => String(v || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  res.send(`<!doctype html><meta charset="utf-8"><title>Juddster interest list</title><style>body{font-family:system-ui;padding:20px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px;text-align:left;vertical-align:top}</style>
<h1>Juddster interest list (${rows.length})</h1><p><a href="/admin?key=${encodeURIComponent(ADMIN_KEY)}&format=csv">Download CSV</a></p>
<table><tr><th>When</th><th>Name</th><th>Email</th><th>City</th><th>Phone</th><th>As</th><th>Seats</th><th>Timing</th><th>Notes</th></tr>
${rows.slice().reverse().map(r => `<tr><td>${esc(r.at.slice(0,16).replace('T',' '))}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.city)}</td><td>${esc(r.phone)}</td><td>${esc(r.kind)}</td><td>${esc(r.seats)}</td><td>${esc(r.when)}</td><td>${esc(r.msg)}</td></tr>`).join('')}</table>`);
});
app.get('/healthz', (req, res) => res.send('ok'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Juddster site on ' + port));
