// Desglose de "En tus cuentas", ingresos extra, corrección de quincena, ahorro programado con rendimientos
const { run, base } = require('./lib');
run(async ({ p, ok, load, keypad }) => {
  // Desglose
  await p.clock.setFixedTime(new Date('2027-03-10T09:46:00'));
  let B0 = new Date('2027-03-04T08:00:00').getTime();
  const t = (id, amount, method, date) => ({ id, amount, desc: 'Gasto ' + id, cat: 'comida', date, method, ts: B0 + 864e5 * 2 });
  await load(base({ saldoDebito: '6000', saldoEfectivo: '567', balanceDate: '2027-03-04', balanceAt: B0, paydays: [{ quincena: '2027-02-Q2', amount: 20000, addedAt: '2027-02-28', ts: B0 - 5e8 }],
    debts: [{ id: 'c', type: 'tarjeta', name: 'Nu', balance: 5000, minPayment: 500, dueDay: '25', cutDay: '5', creditLimit: 20000, monthlyPayments: [{ month: '2027-03', paidAt: '2027-03-06', amount: 1000, ts: B0 + 2e8, extra: true }] }],
    cashTransactions: [t('a', 300, 'debit', '2027-03-05'), t('b', 450, 'debit', '2027-03-08'), t('c', 100, 'cash', '2027-03-09'), t('old', 999, 'debit', '2027-03-01')],
    cardTransactions: [{ id: 'k1', amount: 2500, desc: 'S', cat: 'v1', date: '2027-03-06', cardId: 'c', ts: B0 + 2e8 }, { id: 'k2', amount: 2500, desc: 'R', cat: 'compras', date: '2027-03-07', cardId: 'c', ts: B0 + 3e8 }, { id: 'k3', amount: 2500, desc: 'C', cat: 'v3', date: '2027-03-09', cardId: 'c', ts: B0 + 5e8 }],
    invMoves: [{ date: '2027-03-08', ts: B0 + 4e8, amount: 500 }] }));
  await p.click('.b-heroline .b-linkbtn:has-text("En tus cuentas")'); await p.waitForTimeout(300);
  const L = await p.evaluate(() => { const rows = [...document.querySelectorAll('.b-sheet .b-kv')]; const items = rows.filter(r => !r.classList.contains('strong')).map(r => { const v = r.querySelector('.b-num').textContent; return (v.startsWith('−') ? -1 : 1) * +v.replace(/[^0-9.]/g, ''); });
    return { sum: items.reduce((s, x) => s + x, 0), total: +rows.find(r => r.classList.contains('strong')).querySelector('.b-num').textContent.replace(/[^0-9.]/g, ''), box: (document.querySelector('.b-sheet .b-insight-box') || {}).textContent }; });
  ok('desglose: 6,567 − 750 − 100 − 1,000 − 500', L.total, 4217); ok('desglose: renglones = total', L.sum, L.total);
  ok('desglose: tarjeta aparte', /7,500 con tarjeta/.test(L.box) && /3 compras/.test(L.box), true);
  // Ingresos extra y quincena
  await p.clock.setFixedTime(new Date('2027-03-20T12:00:00'));
  B0 = new Date('2027-03-10T08:00:00').getTime();
  await load(base({ q1: '15000', q2: '15000', paySchedule: '15-ultimo', saldoDebito: '5000', saldoEfectivo: '200', balanceDate: '2027-03-10', balanceAt: B0, paydays: [{ quincena: '2027-03-Q1', amount: 15000, addedAt: '2027-03-15', ts: B0 + 5e8 }] }));
  const DP = () => p.evaluate(() => { const x = calcDP(JSON.parse(localStorage.getItem('mipres-data-v6'))); return [Math.round(x.currentDebit), Math.round(x.currentEfectivo)].join(); });
  ok('inicio', await DP(), '20000,200');
  await p.click('.b-fab'); await p.waitForTimeout(300); await p.click('.b-sheet button:has-text("¿Te llegó dinero?")');
  ok('ingreso: sin tarjeta', await p.isVisible('.b-paywith button:has-text("Tarjeta")'), false);
  await keypad(1500); await p.fill('.b-sheet .b-what', 'Bono'); ok('ingreso: botón', (await p.textContent('.b-what-save')).trim(), 'Sumar $1,500 a tu cuenta');
  await p.click('.b-what-save'); await p.waitForTimeout(1300); ok('ingreso a débito', await DP(), '21500,200');
  await p.click('.b-fab'); await p.waitForTimeout(300); await p.click('.b-sheet button:has-text("¿Te llegó dinero?")');
  await keypad(300); await p.click('.b-paywith button:has-text("Efectivo")'); await p.fill('.b-sheet .b-what', 'Venta'); await p.keyboard.press('Enter'); await p.waitForTimeout(1300);
  ok('ingreso en efectivo con Enter', await DP(), '21500,500');
  await p.click('.b-avatar'); await p.waitForTimeout(400);
  ok('quincena: aviso de la siguiente', /tu siguiente quincena \(\$15,000\) se suma sola el 31 mar/.test(await p.textContent('main')), true);
  await p.fill('.b-field:has-text("Quincena del 1 al 15") input', '16000'); await p.waitForTimeout(400);
  ok('quincena: pregunta si corrige', /ya se sumó como \$15,000\. ¿Te depositaron \$16,000\?/.test(await p.textContent('main')), true);
  await p.click('button:has-text("Sí, corregir a $16,000")'); await p.waitForTimeout(1300); ok('quincena: corrige lo que entró', await DP(), '22500,500');
  // Ahorro programado con rendimientos (cálculo independiente)
  await load(base({ q1: '15000', q2: '15000', saldoDebito: '5000', balanceDate: '2027-03-10', balanceAt: B0, paydays: [{ quincena: '2027-03-Q1', amount: 15000, addedAt: '2027-03-15', ts: 1 }], paidExps: { 's1_2027-01': true, 's1_2027-02': true },
    exps: [{ id: 's1', name: 'Seguro ahorro 1', amount: 4600, day: 30, catId: 6, saving: true, savedBase: 50000, savedBaseDate: '2027-01-20', savedBaseMonth: '2027-01', savedBasePaid: false, rate: 7 }] }));
  const i = 0.07 / 12, days = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5), g = (v, f) => v * Math.pow(1 + i, days(f, '2027-03-20') / 30.4375);
  const exp = g(50000, '2027-01-20') + g(4600, '2027-01-30') + g(4600, '2027-02-28'), f60 = exp * Math.pow(1 + i, 60) + 4600 * (Math.pow(1 + i, 60) - 1) / i;
  const r = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mipres-data-v6')); const a = savingAcc(d.exps[0], d); return { acc: a.acc, gain: a.gain, w: getWealth(d).assetsTotal, f: savingFuture(a.acc, 4600, 7, 60) }; });
  ok('ahorro: acumulado con rendimientos', r.acc.toFixed(2), exp.toFixed(2)); ok('ahorro: rendimiento', r.gain.toFixed(2), (exp - 59200).toFixed(2));
  ok('ahorro: en el patrimonio', r.w.toFixed(2), exp.toFixed(2)); ok('ahorro: 5 años', Math.round(r.f), Math.round(f60));
  await p.click('.b-tab:has-text("Metas")'); await p.waitForTimeout(300);
  ok('ahorro: compara con inflación', /3\.0 puntos arriba de la inflación/.test(await p.textContent('[data-tour="ahorros"]')), true);
});
