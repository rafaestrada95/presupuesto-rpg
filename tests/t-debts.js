// Deudas liquidadas (sin recordatorios), compras a meses con tarjeta, textos de quincena y de corte
const { run, base } = require('./lib');
run(async ({ p, ok, load, D }) => {
  await p.clock.setFixedTime(new Date('2026-11-18T10:00:00'));
  const B0 = new Date('2026-11-10T08:00:00').getTime();
  const nu = { id: 'nu', type: 'tarjeta', name: 'Nu', balance: 5000, minPayment: 500, dueDay: '5', cutDay: '20', creditLimit: 30000, monthlyPayments: [] };
  // Lalito ya en cero (con un "aún no" viejo y día de pago) y un plan terminado
  await load(base({ saldoDebito: '20000', balanceDate: '2026-11-10', balanceAt: B0, overdue: { 'lal|2026-11': true },
    debts: [nu, { id: 'lal', type: 'informal', informalMode: 'deadline', name: 'Lalito', person: 'Lalito', balance: 0, dueDay: '20', deadlineDate: '2026-11-20' },
      { id: 'tv', type: 'plan', name: 'Pantalla', paymentAmount: 1000, totalPayments: 6, paidPayments: 6, dueDay: '19' }] }));
  const r = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mipres-data-v6')); const x = calcDP(d);
    return { pend: x.pendingItems.map(i => i.name).join(), ov: x.overdue, push: pushPayments(d).filter(i => /Lalito|Pantalla/.test(i.name)).length, model: monthlyModel(d).debts }; });
  ok('liquidada: no se aparta', /Lalito|Pantalla/.test(r.pend), false); ok('liquidada: no queda vencida', r.ov, 0);
  ok('liquidada: sin avisos al teléfono', r.push, 0); ok('liquidada: no suma al mes (solo Nu)', r.model, 500);
  ok('liquidada: no sale en Pon atención', /Lalito|Pantalla/.test(await p.textContent('main')), false);
  await p.click('.b-tab:has-text("Metas")'); await p.waitForTimeout(300);
  const rows = await p.$$eval('.b-debts > button', b => b.map(x => x.innerText.replace(/\s+/g, ' ')));
  console.log('   ', rows.join(' | '));
  ok('liquidada: dice Liquidada', rows.filter(t => /Liquidada/.test(t)).length, 2); ok('liquidadas al final', /Nu/.test(rows[0]), true);
  // Compra a meses con tarjeta, desde la app
  await p.click('button:has-text("Agregar una deuda")'); await p.waitForTimeout(300);
  await p.click('.b-sheet button:has-text("Compra a meses")'); await p.waitForTimeout(200);
  await p.fill('#dq-name', 'iPhone'); await p.click('.b-sheet .b-primary'); await p.waitForTimeout(200);
  ok('pregunta si es con tarjeta', (await p.textContent('.b-wiz-q')).trim(), '¿Es a meses con tarjeta de crédito?');
  await p.click('.b-sheet .b-opt:has-text("Sí, con Nu")'); await p.waitForTimeout(200);
  await p.fill('#dq-paymentAmount', '1000'); await p.click('.b-sheet .b-primary'); await p.waitForTimeout(200);
  await p.fill('#dq-totalPayments', '12'); await p.fill('#dq-paidPayments', '3');
  ok('sin preguntar día de pago', (await p.textContent('.b-sheet .b-primary')).trim(), 'Guardar deuda');
  await p.click('.b-sheet .b-primary'); await p.waitForTimeout(1300);
  const m = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mipres-data-v6')); const ip = d.debts.find(x => x.name === 'iPhone'); const x = calcDP(d); const c = creditSummary(d).cards.find(c => c.c.id === 'nu');
    return { card: ip.cardId, from: ip.msiFrom, paid: getPlanInfo(ip).paid, pend: x.pendingItems.some(i => i.name === 'iPhone'), model: monthlyModel(d).debts, owed: Math.round(c.owed), msi: c.msi }; });
  ok('a meses: ligada a Nu', [m.card, m.from].join(), 'nu,2026-11'); ok('a meses: 3 pagados', m.paid, 3);
  ok('a meses: no se aparta aparte', m.pend, false); ok('a meses: no suma doble al mes', m.model, 500);
  ok('a meses: ocupa tu límite (5,000 + 9,000)', [m.owed, m.msi].join(), '14000,9000');
  ok('a meses: en la lista', /iPhone.*A meses con Nu · 3 de 12/.test((await p.textContent('.b-debts')).replace(/\s+/g, ' ')), true);
  await p.clock.setFixedTime(new Date('2026-12-18T10:00:00'));
  ok('a meses: al mes siguiente avanza sola', await p.evaluate(() => getPlanInfo(JSON.parse(localStorage.getItem('mipres-data-v6')).debts.find(x => x.name === 'iPhone')).paid), 4);
  await p.clock.setFixedTime(new Date('2026-11-18T10:00:00'));
  // Explicación de corte y fecha límite con sus fechas
  await p.reload(); await p.waitForTimeout(300); for (const k of '1234') await p.click('#b' + k); await p.waitForTimeout(900);
  await p.click('.b-tab:has-text("Metas")'); await p.waitForTimeout(300); await p.click('.b-debts > button:has-text("Nu")'); await p.waitForTimeout(300);
  await p.click('.b-sheet summary:has-text("¿Qué es el corte")'); await p.waitForTimeout(200);
  const ex = (await p.textContent('.b-sheet')).replace(/\s+/g, ' ');
  ok('corte explicado con sus fechas', /El 20 de nov el banco cierra tu mes y suma lo que compraste del 21 de oct al 20 de nov/.test(ex), true);
  ok('fecha límite explicada', /Tienes hasta el 5 de dic para pagar ese total sin intereses/.test(ex), true);
  await p.click('.b-sheet button:has-text("Cerrar")'); await p.waitForTimeout(200);
  // Quincena: lo que te depositan, con el día
  await p.click('.b-tab:has-text("Inicio")'); await p.waitForTimeout(300); await p.click('.b-avatar'); await p.waitForTimeout(400);
  ok('quincena: etiqueta del 15', await p.isVisible('.b-field:has-text("Lo que te depositan el día 15") input'), true);
  ok('quincena: etiqueta del último día', await p.isVisible('.b-field:has-text("Lo que te depositan el último día del mes") input'), true);
  await p.click('.b-chip:has-text("El 1 y el 16")'); await p.waitForTimeout(400);
  ok('quincena: cambia con el calendario', await p.isVisible('.b-field:has-text("Lo que te depositan el día 1") input'), true);
});
