// Tarjetas: pagos, abonos, pago de más, edición, fechas de corte y pago, sección de crédito
const { run, base } = require('./lib');
run(async ({ p, ok, load, D }) => {
  await p.clock.setFixedTime(new Date('2027-03-10T12:00:00'));
  const B0 = new Date('2027-03-05T08:00:00').getTime();
  const nu = bal => ({ id: 'c', type: 'tarjeta', name: 'Nu', balance: bal, minPayment: 500, dueDay: '25', cutDay: '5', creditLimit: 20000, monthlyPayments: [] });
  const tx = (id, amount, date) => ({ id, amount, desc: 'Compra', cat: 'compras', date: date || '2027-03-08', cardId: 'c', ts: B0 + 864e5 * 3 });
  const data = (debts, ctx) => base({ saldoDebito: '30000', balanceDate: '2027-03-05', balanceAt: B0, debts, cardTransactions: ctx });
  const owed = () => p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mipres-data-v6')); return Math.round(debtBalance(d.debts[0], cardTxAfter(d))); });
  const debit = () => p.evaluate(() => Math.round(calcDP(JSON.parse(localStorage.getItem('mipres-data-v6'))).currentDebit));
  const pay = async (n, extra) => { await p.click('.b-credit button:has-text("Registrar pago")'); await p.waitForTimeout(200); if (extra) await p.click('.b-sheet button:has-text("Es un abono extra")'); await p.fill('.b-sheet input', String(n)); await p.click('.b-sheet .b-primary'); await p.waitForTimeout(1500); };
  const addTx = (id, amount) => p.evaluate(([id, amount]) => { const d = JSON.parse(localStorage.getItem('mipres-data-v6')); d.cardTransactions.push({ id, amount, desc: 'x', cat: 'compras', date: '2027-03-10', cardId: 'c', ts: Date.now() }); localStorage.setItem('mipres-data-v6', JSON.stringify(d)); }, [id, amount]);
  await load(data([nu(0)], [tx('k1', 3000)]));
  ok('saldo 0 + compra 3,000: debe', await owed(), 3000); const d0 = await debit();
  await pay(3000); ok('paga 3,000: debe', await owed(), 0); ok('débito baja 3,000', d0 - await debit(), 3000);
  await p.click('.b-toast button:has-text("Deshacer")'); await p.waitForTimeout(1500); ok('deshacer: vuelve a deber', await owed(), 3000); ok('deshacer: débito regresa', await debit(), d0);
  await load(data([nu(1000)], [tx('k1', 2000)])); await pay(3000); ok('saldo 1,000 + compra 2,000, paga 3,000: debe', await owed(), 0);
  await load(data([nu(0)], [tx('k1', 1000)])); await pay(1500); ok('paga 1,500 de 1,000: debe', await owed(), 0);
  await addTx('k2', 400); ok('compra 400 con 500 a favor: debe', await owed(), 0);
  await addTx('k3', 200); ok('otra compra 200: debe', await owed(), 100);
  await load(data([{ ...nu(3000), pngi: 3000 }], []));
  await pay(500, true); ok('abono 500 de 3,000: debe', await owed(), 2500);
  ok('abono no cuenta como pago del mes', await p.evaluate(() => cardStatus(JSON.parse(localStorage.getItem('mipres-data-v6')).debts[0]).ok), false);
  await pay(2500); ok('pago del mes 2,500: debe', await owed(), 0);
  // Editar: lo que escribes es el total del banco
  await load(data([nu(1000)], [tx('k1', 2000)]));
  await p.click('.b-tab:has-text("Metas")'); await p.waitForTimeout(300); await p.click('button:has-text("Nu")'); await p.waitForTimeout(300);
  await p.click('.b-sheet summary:has-text("Editar datos")');
  ok('el campo muestra el total', await p.inputValue('.b-sheet .b-field:has-text("Lo que debes hoy") input'), '3000');
  await p.fill('.b-sheet .b-field:has-text("Lo que debes hoy") input', '3500'); await p.fill('.b-sheet .b-field:has-text("Límite de crédito") input', '25000');
  await p.click('.b-sheet button:has-text("Guardar cambios")'); await p.waitForTimeout(1500);
  ok('banco dice 3,500: debe', await owed(), 3500); ok('nuevo límite', (await D()).debts[0].creditLimit, 25000);
  // Fechas
  const F = await p.evaluate(() => { const iso = d => d.toLocalISO().slice(0, 10);
    const a = cardDates({ cutDay: '5', dueDay: '25' }, new Date('2027-03-10T12:00:00')), b = cardDates({ cutDay: '12', dueDay: '2' }, new Date('2027-03-10T12:00:00'));
    const c = cardDates({ cutDay: '30', dueDay: '20' }, new Date('2027-02-27T12:00:00')), d = cardDates({ cutDay: '5', dueDay: '25' }, new Date('2027-03-05T12:00:00'));
    const g = getCardInfo({ id: 'c', cutDay: '5', dueDay: '10' }, [], new Date('2027-03-10T12:00:00'));
    const h = getCardInfo({ id: 'c', cutDay: '5', dueDay: '25' }, [{ cardId: 'c', date: '2027-03-05', amount: 100 }, { cardId: 'c', date: '2027-03-06', amount: 50 }], new Date('2027-03-10T12:00:00'));
    return { a: [iso(a.due), a.daysToDue], b: [iso(b.due), b.daysToDue], c: [iso(c.nextCut), iso(c.due), c.daysToDue], d: [d.daysToCut, iso(d.due)], g: g.daysUntilPay, h: h.cycleSpend }; });
  ok('corte 5 / pago 25, hoy 10 mar', F.a.join(' '), '2027-04-25 46'); ok('corte 12 / pago 2', F.b.join(' '), '2027-04-02 23');
  ok('corte 30 en febrero = 28 feb', F.c.join(' '), '2027-02-28 2027-03-20 21'); ok('hoy es día de corte', F.d.join(' '), '0 2027-03-25');
  ok('hoy es día de pago: 0 días', F.g, 0); ok('compra del día de corte va al estado anterior', F.h, 50);
  // Sección de crédito
  await load(data([nu(1000), { id: 'b', type: 'tarjeta', name: 'BBVA', balance: 6500, minPayment: 400, dueDay: '2', cutDay: '12', creditLimit: 10000, monthlyPayments: [] }], [tx('k1', 2000)]));
  const S = await p.evaluate(() => { const s = creditSummary(JSON.parse(localStorage.getItem('mipres-data-v6'))); return [s.limit, Math.round(s.owed), Math.round(s.avail), s.pct, s.best && s.best.c.name].join(' '); });
  ok('crédito: límite, debes, disponible, uso, mejor', S, '30000 9500 20500 32 Nu');
  ok('tu dinero no incluye crédito', await p.evaluate(() => { const x = calcDP(JSON.parse(localStorage.getItem('mipres-data-v6'))); return Math.round(x.currentDebit + x.currentEfectivo); }), 30000);
});
