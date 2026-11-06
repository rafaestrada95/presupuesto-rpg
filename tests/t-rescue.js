// Si algo falla al abrir Budgy: pantalla de rescate (nunca en blanco), reintentar y bajar tus datos
const { run, base } = require('./lib');
run(async ({ p, ok, load, unlock, errs, shot }) => {
  await p.clock.setFixedTime(new Date('2026-11-06T09:00:00'));
  await load(base({ saldoDebito: '1000', balanceDate: '2026-11-01', balanceAt: 1 }));
  ok('normal: abre sin rescate', [!!(await p.$('.b-hero')), !!(await p.$('#rescue'))].join(), 'true,false');
  ok('React sale de la propia app', await p.evaluate(() => [...document.scripts].filter(s => /react/.test(s.src)).every(s => s.src.includes('/vendor/'))), true);
  // Datos que hacen tronar la app
  await load(base({ saldoDebito: '1000', balanceDate: '2026-11-01', balanceAt: 1, debts: null }));
  await p.waitForTimeout(500);
  ok('datos rotos: pantalla de rescate', await p.isVisible('#rescue'), true);
  ok('datos rotos: dice qué pasó', /Detalle: .+/.test(await p.textContent('#rsm')), true);
  await p.screenshot({ path: shot('rescate.png') });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#rs2')]);
  const saved = JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8'));
  ok('descarga tus datos (sin el PIN)', Object.keys(saved).sort().join(), 'budgy-prefs,mipres-data-v6,mipres-name');
  await Promise.all([p.waitForEvent('load'), p.click('#rs1')]); await p.waitForTimeout(300);
  ok('volver a intentar recarga la app', await p.isVisible('#ps'), true);
  // React no cargó
  await load(base({ saldoDebito: '1000' }));
  await p.evaluate(() => window.pinReset()); await p.evaluate(() => { window.__budgyRoot = null; window.React = undefined; });
  await unlock();
  ok('sin React: pantalla de rescate', await p.isVisible('#rescue'), true);
  ok('sin React: dice que revises tu internet', (await p.textContent('#rsm')).includes('Revisa tu internet'), true);
  errs.length = 0; // los errores provocados a propósito no cuentan
});
