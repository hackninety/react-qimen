/**
 * 引擎适配器冒烟 + 跨引擎一致性测试
 *
 * 基准盘：2024-06-15 14:30 → 芒种 阳遁六局上元（拆补），值符天柱、值使惊门
 * （已由 3meta / qimendunjia-standalone / kinqimen / qimen-mingfa 四家独立算法互相印证）
 */
import { describe, expect, it } from 'vitest';
import { listQimenEngines, getQimenEngine, listEnginesBySchool, resolveLayer } from '../registry';
import type { UnifiedQimenChart } from '../types';

const BASE_DATE = new Date(2024, 5, 15, 14, 30, 0);
const YIN_DATE = new Date(2024, 6, 15, 12, 0, 0); // 小暑 阴遁

function checkStructure(chart: UnifiedQimenChart) {
  expect(chart.palaces).toHaveLength(9);
  expect(chart.palaces.map((p) => p.gong)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const p of chart.palaces) {
    if (p.gong === 5) continue; // 中五宫依流派可为空
    expect(p.diPanGan.length, `宫${p.gong} 地盘干`).toBeGreaterThan(0);
    expect(p.tianPanGan.length, `宫${p.gong} 天盘干`).toBeGreaterThan(0);
    expect(p.star, `宫${p.gong} 星`).toBeTruthy();
    expect(p.gate, `宫${p.gong} 门`).toBeTruthy();
    expect(p.god, `宫${p.gong} 神`).toBeTruthy();
  }
  expect(chart.meta.ju).toBeGreaterThanOrEqual(1);
  expect(chart.meta.ju).toBeLessThanOrEqual(9);
  expect(['阳遁', '阴遁']).toContain(chart.meta.dun);
}

/** 星名归一：'天柱'/'柱'/'禽芮'/'天禽/天芮' → 首星单字 */
const normStar = (s?: string) => s?.replace(/天/g, '').split('/')[0]?.[0] ?? '';

describe('时家转盘 · 拆补法基准盘 2024-06-15 14:30', () => {
  const engines = listEnginesBySchool('时家转盘');

  for (const engine of engines) {
    it(`${engine.name} 结构完整且局数正确`, () => {
      const chart = engine.compute({ date: BASE_DATE, method: '拆补' });
      checkStructure(chart);
      expect(chart.meta.dun).toBe('阳遁');
      expect(chart.meta.ju).toBe(6);
      expect(normStar(chart.meta.zhiFu)).toBe('柱');
      expect(chart.meta.zhiShi?.[0]).toBe('惊');
      expect(chart.meta.siZhu.day).toBe('庚戌');
      expect(chart.meta.siZhu.hour).toBe('癸未');
    });
  }

  it('各引擎值符落宫一致', () => {
    const gongs = engines.map((e) => e.compute({ date: BASE_DATE, method: '拆补' }).meta.zhiFuGong);
    expect(new Set(gongs).size).toBe(1);
    expect(gongs[0]).toBe(2);
  });
});

describe('时家转盘 · 阴遁一致性 2024-07-15 12:00', () => {
  const engines = listEnginesBySchool('时家转盘');
  const charts = engines.map((e) => ({ e, c: e.compute({ date: YIN_DATE, method: '拆补' }) }));

  it('全部为阴遁且局数一致', () => {
    for (const { e, c } of charts) {
      expect(c.meta.dun, e.name).toBe('阴遁');
      expect(c.meta.ju, e.name).toBe(charts[0].c.meta.ju);
    }
  });

  it('值符星一致', () => {
    const stars = charts.map(({ c }) => normStar(c.meta.zhiFu));
    expect(new Set(stars).size).toBe(1);
  });
});

describe('多定局法', () => {
  it('bigfish 茅山/置闰可用且结构完整', () => {
    for (const method of ['茅山', '置闰'] as const) {
      const chart = getQimenEngine('bigfish').compute({ date: BASE_DATE, method });
      checkStructure(chart);
      expect(chart.method).toBe(method);
    }
  });

  it('taobi 茅山/均分可用且结构完整', () => {
    for (const method of ['茅山', '均分'] as const) {
      const chart = getQimenEngine('taobi').compute({ date: BASE_DATE, method });
      checkStructure(chart);
    }
  });
});

describe('飞盘鸣法', () => {
  it('鸣法基准盘：阳遁六局，值符天柱、值使惊门，格局非空', () => {
    const chart = getQimenEngine('mingfa').compute({ date: BASE_DATE, method: '鸣法' });
    checkStructure(chart);
    expect(chart.meta.dun).toBe('阳遁');
    expect(chart.meta.ju).toBe(6);
    expect(chart.meta.zhiFu).toBe('天柱');
    expect(chart.meta.zhiShi).toBe('惊门');
    expect(chart.patterns?.length ?? 0).toBeGreaterThan(0);
    // 鸣法中宫也有完整星门神
    const zhong = chart.palaces[4];
    expect(zhong.star).toBeTruthy();
    expect(zhong.gate).toBeTruthy();
  });
});

describe('taobi 与 3meta 拆补对照扫描（值使推导回归，含符首落中五的寄宫边界）', () => {
  it('冬至后连续多日多时辰局数/值使一致、值符星有交集', () => {
    const taobi = getQimenEngine('taobi');
    const sanmeta = getQimenEngine('sanmeta');
    for (let d = 0; d < 6; d++) {
      for (const h of [1, 9, 13, 21]) {
        const date = new Date(2024, 11, 22 + d, h, 30);
        const tag = `2024-12-${22 + d} ${h}:30`;
        const a = taobi.compute({ date, method: '拆补' });
        const b = sanmeta.compute({ date, method: '拆补' });
        expect(`${a.meta.dun}${a.meta.ju}`, tag).toBe(`${b.meta.dun}${b.meta.ju}`);
        expect(a.meta.zhiShi, tag).toBe(b.meta.zhiShi);
        expect(a.meta.zhiShi, tag).toBeTruthy();
        // 值符星允许 天禽/天芮 并写差异，按星字交集判定
        const setA = new Set((a.meta.zhiFu ?? '').replace(/[天/]/g, '').split(''));
        const setB = new Set((b.meta.zhiFu ?? '').replace(/[天/]/g, '').split(''));
        expect([...setA].some((c) => setB.has(c)), `${tag} 值符 ${a.meta.zhiFu} vs ${b.meta.zhiFu}`).toBe(true);
      }
    }
  });
});

describe('年/月/日家四层盘', () => {
  const layerEngines = listQimenEngines().filter((e) => e.layers.length > 1);

  it('bigfish 与 jelly 声明支持四层', () => {
    expect(layerEngines.map((e) => e.id).sort()).toEqual(['bigfish', 'jelly']);
    for (const e of layerEngines) {
      expect(e.layers).toEqual(['时家', '日家', '月家', '年家']);
    }
  });

  for (const engine of listQimenEngines().filter((e) => e.layers.includes('年家'))) {
    for (const layer of ['年家', '月家', '日家'] as const) {
      it(`${engine.name} ${layer}结构完整、局数与值符值使有效`, () => {
        const chart = engine.compute({ date: BASE_DATE, method: '拆补', layer });
        checkStructure(chart);
        expect(chart.layer).toBe(layer);
        expect(chart.meta.zhiFu, '值符星').toBeTruthy();
        expect(chart.meta.zhiShi, '值使门').toBeTruthy();
        expect(chart.meta.zhiFuGong).toBeGreaterThanOrEqual(1);
        if (layer === '年家') expect(chart.meta.siZhu.year, '年家须有年柱').toBeTruthy();
      });
    }
  }

  it('bigfish 年家：2024 甲辰年 → 阴遁七局下元、四柱仅年柱', () => {
    const chart = getQimenEngine('bigfish').compute({ date: BASE_DATE, method: '拆补', layer: '年家' });
    expect(chart.meta.siZhu.year).toBe('甲辰');
    expect(chart.meta.siZhu.month).toBe('');
    expect(chart.meta.dun).toBe('阴遁');
    expect(chart.meta.ju).toBe(7);
  });

  it('不支持的盘类回退时家（resolveLayer）', () => {
    expect(resolveLayer(getQimenEngine('sanmeta'), '年家')).toBe('时家');
    expect(resolveLayer(getQimenEngine('bigfish'), '年家')).toBe('年家');
  });
});

describe('注册表', () => {
  it('注册了 6 个引擎，默认引擎为 3meta', () => {
    expect(listQimenEngines()).toHaveLength(6);
    expect(getQimenEngine('sanmeta').id).toBe('sanmeta');
  });
});
