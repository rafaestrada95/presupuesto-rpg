// Anotar ("Otro", Enter, un toque), recorrido completo y todas las pantallas sin errores
const { run, base } = require('./lib');
run(async ({ p, ok, load, D, keypad }) => {
  await p.clock.setFixedTime(new Date('2027-03-10T12:00:00'));
  const B0 = new Date('2027-03-04T08:00:00').getTime();
  await load(base({ saldoDebito: '10000', balanceDate: '2027-03-04', balanceAt: B0, emerGoal: '40000', emerSaved: '5000',
    exps: [{ id: 'e1', name: 'Renta', amount: 8000, day: 12, catId: 1 }, { id: 's1', name: 'Seguro', amount: 1000, day: 30, catId: 6, saving: true }],
    debts: [{ id: 'c', type: 'tarjeta', name: 'Nu', balance: 3000, minPayment: 500, dueDay: '25', cutDay: '5', creditLimit: 20000, monthlyPayments: [] }],
    apartados: [{ id: 'ap', name: 'Predial', goal: 6000, saved: 0, when: '2027-12-01', moves: [] }],
    investments: [{ id: 'iv', name: 'CETES', kind: 'plazo', amount: 20000, rate: 10, start: '2027-03-01', maturity: '2027-03-29', termDays: 28 }],
    cashTransactions: [{ id: 't1', amount: 120, desc: 'Tacos', cat: 'comida', date: '2027-03-09', method: 'debit', ts: B0 + 4e8 }] }));
  await p.click('.b-fab'); await p.waitForTimeout(300); await keypad(250);
  await p.click('.b-sheet .b-cat:has-text("Otro")'); await p.waitForTimeout(200);
  ok('Otro: no guarda todavía', (await D()).cashTransactions.length, 1);
  ok('Otro: cursor en ¿Qué fue?', await p.evaluate(() => document.activeElement.classList.contains('b-what')), true);
  await p.keyboard.type('Farmacia'); ok('Otro: botón', (await p.textContent('.b-what-save')).trim(), 'Guardar $250 en Farmacia');
  await p.click('.b-what-save'); await p.waitForTimeout(1200);
  let t = (await D()).cashTransactions.slice(-1)[0]; ok('Otro: guardado', [t.amount, t.desc, t.cat].join('|'), '250|Farmacia|v6');
  await p.click('.b-fab'); await p.waitForTimeout(300); await keypad(90); await p.click('.b-sheet .b-what'); await p.keyboard.type('Uber'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
  t = (await D()).cashTransactions.slice(-1)[0]; ok('Enter guarda', [t.amount, t.desc].join('|'), '90|Uber');
  await p.click('.b-fab'); await p.waitForTimeout(300); await keypad(60); await p.click('.b-sheet .b-cat:has-text("Café")'); await p.waitForTimeout(1200);
  t = (await D()).cashTransactions.slice(-1)[0]; ok('un toque en Café', [t.amount, t.cat].join('|'), '60|cafe');
  // Recorrido completo
  await p.click('.b-help'); const steps = [];
  for (let n = 0; n < 25; n++) { await p.waitForTimeout(400); steps.push(await p.textContent('.b-gt-t')); const nx = await p.textContent('.b-gt-next'); await p.click('.b-gt-next'); if (nx === 'Listo') break; }
  ok('recorrido: pasos', steps.length, 16); await p.waitForTimeout(300); ok('recorrido: se cierra', await p.$('.b-gt'), null);
  for (const tab of ['Movimientos', 'Presupuesto', 'Metas', 'Inicio']) { await p.click(`.b-tab:has-text("${tab}")`); await p.waitForTimeout(300); ok('pantalla ' + tab, (await p.textContent('.b-tab.on')).trim(), tab); }
});
