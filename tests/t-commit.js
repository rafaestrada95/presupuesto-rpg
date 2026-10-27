// "Ya comprometido": compras con tarjeta del corte, corte cerrado, pagos fijos con tarjeta vencidos o pendientes
const { run, base } = require('./lib');
run(async ({ p, ok, load }) => {
  const DP = () => p.evaluate(() => { const x = calcDP(JSON.parse(localStorage.getItem('mipres-data-v6'))); return { libre: Math.round(x.realBalance), commit: Math.round(x.cardCommit), cuentas: Math.round(x.currentDebit), ov: x.overdue, pf: x.pendingFixed }; });
  const pay = async (n, extra) => { await p.click('.b-credit button:has-text("Registrar pago")'); await p.waitForTimeout(200); if (extra) await p.click('.b-sheet button:has-text("Es un abono extra")'); await p.fill('.b-sheet input', String(n)); await p.click('.b-sheet .b-primary'); await p.waitForTimeout(1500); };
  // A) compras del corte actual
  await p.clock.setFixedTime(new Date('2027-03-10T12:00:00'));
  let B0 = new Date('2027-03-04T08:00:00').getTime();
  const nu = (dueDay, pngi, bal) => ({ id: 'c', type: 'tarjeta', name: 'Nu', balance: bal == null ? 2000 : bal, minPayment: 300, pngi, dueDay, cutDay: '5', creditLimit: 20000, monthlyPayments: [] });
  const tx = (id, amount, date, ts) => ({ id, amount, desc: 'x', cat: 'v3', date, cardId: 'c', ts });
  const mk = (dueDay, ctx) => base({ saldoDebito: '10000', balanceDate: '2027-03-04', balanceAt: B0, debts: [nu(dueDay, 2000)], cardTransactions: ctx || [tx('k1', 1500, '2027-03-06', B0 + 2e8), tx('k2', 1000, '2027-03-09', B0 + 4e8)] });
  await load(mk('25'));
  let r = await DP(); ok('A) compras del corte comprometidas', r.commit, 2500); ok('A) libre', r.libre, 7500);
  await pay(1000, true); r = await DP(); ok('A) abono: cuentas bajan', r.cuentas, 9000); ok('A) abono: comprometido baja', r.commit, 1500); ok('A) abono no cambia tu libre', r.libre, 7500);
  await p.click('.b-linkbtn:has-text("ya comprometido")'); await p.waitForTimeout(300);
  ok('A) en el detalle', /Nu: compras de este corte.*Con tarjeta · las pagas el 25 de abr/.test((await p.textContent('.b-sheet')).replace(/\s+/g, ' ')), true);
  await load(mk('12')); r = await DP(); ok('B) pago de esta quincena + compras, sin contar doble', r.libre, 5500);
  await load(mk('25', [])); r = await DP(); ok('C) sin compras: nada extra', [r.commit, r.libre].join(), '0,10000');
  // D) día después del corte: compras del corte que ya cerró
  await p.clock.setFixedTime(new Date('2027-03-07T12:00:00'));
  B0 = new Date('2027-02-28T08:00:00').getTime();
  const mk2 = (dueDay, pngi) => base({ saldoDebito: '10000', balanceDate: '2027-02-28', balanceAt: B0, paydays: [{ quincena: '2027-02-Q2', amount: 20000, addedAt: '2027-02-28', ts: B0 - 1000 }], debts: [nu(dueDay, pngi, 0)], cardTransactions: [tx('k1', 3000, '2027-03-02', B0 + 2e8), tx('k2', 500, '2027-03-06', B0 + 6e8)] });
  await load(mk2('25', '')); r = await DP(); ok('D) corte cerrado 3,000 + este corte 500', r.commit, 3500); ok('D) libre', r.libre, 6500);
  await pay(3000); r = await DP(); ok('D) pagas el estado: queda este corte', r.commit, 500); ok('D) pagar no cambia tu libre', r.libre, 6500);
  await load(mk2('12', '1000')); r = await DP(); ok('E) pago sin intereses viejo: aparta lo que compraste', r.libre, 6500);
  // F) pagos fijos con tarjeta: vencidos y pendientes también tienen dueño
  await p.clock.setFixedTime(new Date('2026-10-27T20:44:00'));
  B0 = new Date('2026-10-20T08:00:00').getTime();
  await load(base({ q1: '15000', q2: '15000', saldoDebito: '10000', balanceDate: '2026-10-20', balanceAt: B0, paydays: [{ quincena: '2026-10-Q1', amount: 15000, addedAt: '2026-10-15', ts: 1 }], overdue: { 's2|2026-10': true },
    exps: [{ id: 's2', name: 'Seguro ahorro 2', amount: 8970, day: 15, catId: 6, saving: true, payWith: 'nu' }, { id: 's3', name: 'Seguro ahorro 3', amount: 1000, day: 30, catId: 6, saving: true, payWith: 'nu' }],
    debts: [{ id: 'nu', type: 'tarjeta', name: 'Nu', balance: 0, minPayment: 300, dueDay: '5', cutDay: '20', creditLimit: 30000, monthlyPayments: [] }] }), null, 'Rafa E');
  r = await DP(); ok('F) vencido con tarjeta cuenta', r.ov, 8970); ok('F) pendiente con tarjeta cuenta', r.pf, 1000); ok('F) libre = 10,000 − 8,970 − 1,000', r.libre, 30);
  await p.click('.b-linkbtn:has-text("ya comprometido")'); await p.waitForTimeout(300);
  const t = (await p.textContent('.b-sheet')).replace(/\s+/g, ' ');
  ok('F) detalle: vencido por nombre', /Seguro ahorro 2\s*Vencido el 15 de oct · con Nu · aún no lo pagas\s*\$8,970/.test(t), true);
  ok('F) detalle: pendiente con tarjeta', /Seguro ahorro 3\s*Toca pagar · día 30 · con Nu\s*\$1,000/.test(t), true);
  await p.click('.b-sheet button:has-text("Cerrar")'); await p.waitForTimeout(200);
  await p.click('.b-rows > div:has-text("Seguro ahorro 2") button:has-text("Ya pagué")'); await p.waitForTimeout(1300);
  r = await DP(); ok('F) pagado: ya no está vencido', r.ov, 0); ok('F) pagado: pasa a compras de Nu', r.commit, 8970); ok('F) pagarlo no cambia tu libre', r.libre, 30);
});
