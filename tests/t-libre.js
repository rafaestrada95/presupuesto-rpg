// El dinero libre no salta sin explicación: día de pago, pagos recién vencidos y "¿Qué cambió?"
const { run, base } = require('./lib');
const path = require('path');
run(async ({ p, ok, load, unlock }) => {
  const B0 = new Date('2026-11-10T08:00:00').getTime();
  const data = base({ q1: '15000', q2: '15000', paySchedule: '15-ultimo', saldoDebito: '5000', balanceDate: '2026-11-10', balanceAt: B0,
    paydays: [{ quincena: '2026-10-Q2', amount: 15000, addedAt: '2026-10-31', ts: 1 }],
    exps: [{ id: 'r', name: 'Renta', amount: 8000, day: 14, catId: 1 }, { id: 'l', name: 'Luz', amount: 1000, day: 20, catId: 1 }] });
  const DP = () => p.evaluate(() => { const x = calcDP(JSON.parse(localStorage.getItem('mipres-data-v6'))); return { libre: Math.round(x.realBalance), cuentas: Math.round(x.currentDebit), items: x.pendingItems.map(i => i.name + ':' + i.amount).join() }; });
  const day = async iso => { await p.clock.setFixedTime(new Date(iso + 'T10:00:00')); await p.reload(); await unlock(); };
  // Día 14: toca la renta; la luz del 20 la cubre la quincena de mañana
  await p.clock.setFixedTime(new Date('2026-11-14T10:00:00'));
  await load(data);
  let r = await DP(); ok('día 14: libre = 5,000 − renta 8,000', r.libre, -3000);
  // Día 15: cae la quincena. La renta venció ayer y no has dicho si la pagaste: sigue apartada.
  // Y la luz del 20 ya se paga con este dinero (la quincena de hoy ya está en tu cuenta): se aparta desde hoy.
  await day('2026-11-15');
  r = await DP(); ok('día 15: libre = 5,000 + 15,000 − 8,000 − 1,000', r.libre, 11000); ok('día 15: renta sigue apartada', /Renta:8000/.test(r.items), true);
  ok('día 15: hoy puedes gastar = 11,000 / 15 días', (await p.textContent('.b-daily')).replace(/\s+/g, ' ').trim(), 'Hoy puedes gastar $733');
  ok('día 15: hasta tu siguiente quincena', /libres hasta tu siguiente quincena \(30 de noviembre\)/.test(await p.textContent('.b-hero')), true);
  ok('día 15: faltan 15 días', /Día 1 de 15 de tu quincena\s*Faltan 15 días/.test(await p.textContent('.b-used')), true);
  ok('aviso de cambio', (await p.textContent('.b-chg')).trim(), 'Desde ayer: subió $14,000 · ¿por qué?');
  await p.screenshot({ path: path.join(__dirname, 'out', 'cambio-home.png') });
  await p.click('.b-chg'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'out', 'cambio-sheet.png') });
  const rows = await p.evaluate(() => [...document.querySelectorAll('.b-sheet .b-kv')].map(r => [r.querySelector('span').childNodes[0].textContent, +r.querySelector('.b-num').textContent.replace(/[^0-9]/g, '') * (r.querySelector('.b-num').textContent.includes('−') ? -1 : 1)]));
  console.log('   ', JSON.stringify(rows));
  ok('explica: quincena +15,000', JSON.stringify(rows.find(x => x[0] === 'Te cayó tu quincena')), '["Te cayó tu quincena",15000]');
  ok('los renglones suman el total', rows.slice(0, -1).reduce((s, x) => s + x[1], 0), rows[rows.length - 1][1]);
  await p.click('.b-sheet button:has-text("Cerrar")'); await p.waitForTimeout(200);
  await p.click('.b-linkbtn:has-text("ya comprometido")'); await p.waitForTimeout(300);
  ok('detalle: venció y pregunta', /Renta\s*Venció el 14 de nov · ¿ya lo pagaste\?/.test(await p.textContent('.b-sheet')), true);
  await p.click('.b-sheet button:has-text("Cerrar")'); await p.waitForTimeout(200);
  // Día 16: no debe saltar
  await day('2026-11-16');
  r = await DP(); ok('día 16: el libre no salta', r.libre, 11000); ok('día 16: sin aviso de cambio', await p.$('.b-chg'), null);
  // "Sí" pagaste la renta: sale de la cuenta y de lo comprometido; el libre no cambia
  await p.click('.b-rows > div:has-text("Renta") .b-askbtns button:has-text("Sí")'); await p.waitForTimeout(1300);
  r = await DP(); ok('pagada: cuentas bajan 8,000', r.cuentas, 12000); ok('pagada: libre igual', r.libre, 11000);
});
