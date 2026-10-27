// Utilidades para las pruebas de Budgy con Playwright (sin internet: React sale de tests/vend)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const V = path.join(__dirname, 'vend');
const APP = 'file://' + path.resolve(__dirname, '..', 'index.html');
const DEF_PREFS = { game: false, installDismissed: true, freshDismissed: true, tourSeen: true, newsSeen: ['credito-1', 'tarjeta-comprometido-1', 'ahorro-1'], lastBackup: Date.now() };
let fails = 0;
const ok = (k, a, b) => { const good = a === b; if (!good) fails++; console.log((good ? 'OK  ' : 'FAIL'), k, a, 'esperado', b); };
async function run(fn) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**/react.production.min.js', r => r.fulfill({ body: fs.readFileSync(path.join(V, 'react.production.min.js')), contentType: 'text/javascript' }));
  await ctx.route('**/react-dom.production.min.js', r => r.fulfill({ body: fs.readFileSync(path.join(V, 'react-dom.production.min.js')), contentType: 'text/javascript' }));
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
  const unlock = async () => { await p.waitForTimeout(300); for (const k of '1234') await p.click('#b' + k); await p.waitForTimeout(900); };
  const load = async (data, prefs, name) => {
    await p.goto(APP);
    await p.evaluate(([d, pr, n]) => { localStorage.clear(); localStorage.setItem('mipres-pin', JSON.stringify('1234')); localStorage.setItem('mipres-name', JSON.stringify(n)); localStorage.setItem('mipres-data-v6', JSON.stringify(d)); localStorage.setItem('budgy-prefs', JSON.stringify(pr)); }, [data, prefs || DEF_PREFS, name || 'R']);
    await p.reload(); await unlock();
  };
  const D = () => p.evaluate(() => JSON.parse(localStorage.getItem('mipres-data-v6')));
  const keypad = async n => { for (const k of String(n)) await p.click(`.b-sheet .b-key:text-is("${k}")`); };
  try { await fn({ p, ok, load, unlock, D, keypad, errs, shot: name => path.join(__dirname, 'out', name) }); }
  catch (e) { fails++; console.log('FAIL excepción', e.message.split('\n')[0]); }
  ok('sin errores en la página', JSON.stringify(errs), '[]');
  await b.close();
  process.exitCode = fails ? 1 : 0;
}
// Datos base: todo vacío salvo lo que cada prueba ponga
const base = extra => Object.assign({ q1: '20000', q2: '20000', saldoDebito: '0', saldoEfectivo: '0', paydays: [], paidExps: {}, exps: [], debts: [], apartados: [], cashTransactions: [], cardTransactions: [], varExps: [], extraIncome: [], loans: [], incomeTransactions: [], cardPayments: [], investments: [], invMoves: [], onboardingComplete: true, catsV2: true, cafeMigrated: true }, extra);
module.exports = { run, base, DEF_PREFS };
