/**
 * 引擎冒烟/对照脚本：对同一时间跑全部算法库，打印原始输出结构。
 * 用法：node scripts/engines-smoke.mjs [YYYY-MM-DDTHH:mm]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const arg = process.argv[2];
const dt = arg ? new Date(arg) : new Date(2024, 5, 15, 14, 30, 0);
const [y, mo, d, h, mi] = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes()];
const pad = (n) => String(n).padStart(2, '0');
const dtText = `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:00`;
console.log(`采样时间: ${dtText}`);

const dump = (name, v) =>
  console.log(
    `\n########## ${name} ##########\n` +
      JSON.stringify(v, (k, val) => (val instanceof Map ? Object.fromEntries(val) : val), 1).slice(0, 4000),
  );

// 1. 3meta（时家转盘·拆补）
try {
  const m = require('3meta');
  const chart = m.QimenChart.byDatetime(dtText);
  dump('3meta: 局/值符值使', { ju: chart.ju, yuan: chart.yuan, zhiFu: chart.zhiFu, zhiShi: chart.zhiShi, jieqi: chart.timeInfo.solarTerm });
} catch (e) { console.log('3meta ERROR:', e.message); }

// 2. qimendunjia-standalone（时家转盘·拆补）
try {
  const { calculate } = await import('qimendunjia-standalone');
  const r = calculate(dt);
  if ('error' in r) throw new Error(r.message);
  dump('jelly: info', r.info);
  dump('jelly: raw', r.raw);
} catch (e) { console.log('jelly ERROR:', e.message); }

// 3. kinqimen（时家转盘·拆补）
try {
  const { Qimen } = await import('kinqimen');
  const pan = new Qimen({ year: y, month: mo, day: d, hour: h, minute: mi }).pan();
  dump('kinqimen: pan', pan);
} catch (e) { console.log('kinqimen ERROR:', e.message); }

// 4. taobi（时家转盘·均分/拆补/茅山）
try {
  const { TheArtOfBecomingInvisible } = require('taobi');
  const t = new TheArtOfBecomingInvisible(dt, null, null, null, { elements: 1 }); // 1=拆补
  dump('taobi: 实例元数据', {
    keys: Object.keys(t),
    r: t.r,
    element: t.element,
    calendar: t.calendar ? Object.keys(t.calendar) : null,
  });
  dump('taobi: canvas[中][中]', t.getCanvas()[1][1]);
} catch (e) { console.log('taobi ERROR:', e.message); }

// 5. qimen-mingfa（飞盘·鸣法）
try {
  const { paipan } = require('qimen-mingfa');
  const r = paipan({ time: { year: y, month: mo, day: d, hour: h, minute: mi }, additionalSettings: { traditionalCharacters: false, singleCharacter: false } });
  dump('mingfa: 局', { allTimeInformation: r.allTimeInformation, xunShou: r.xunShou, zhiFu: r.zhiFu, zhiShi: r.zhiShi });
  dump('mingfa: panJuResult keys', Object.keys(r.panJuResult ?? {}));
  const first = r.panJuResult && Object.entries(r.panJuResult)[0];
  if (first) dump(`mingfa: panJuResult.${first[0]}`, first[1]);
} catch (e) { console.log('mingfa ERROR:', e.message); }

// 6. qimen-dunjia（arc119226 时家转盘·拆补）
try {
  const m = await import('qimen-dunjia');
  const chart = m.generateChartByDatetime(`${y}${pad(mo)}${pad(d)}${pad(h)}`);
  const obj = m.chartToObject(chart);
  dump('qimen-dunjia: exports', Object.keys(m));
  dump('qimen-dunjia: obj', obj);
} catch (e) { console.log('qimen-dunjia ERROR:', e.message); }
