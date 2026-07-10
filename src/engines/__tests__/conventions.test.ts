/**
 * 引擎口径回归测试（P1 实测沉淀）
 * 1. 晚子时：各引擎 23:00~24:00 的日柱口径与 engine.lateZi 声明一致；
 * 2. bigfish 年/月家立春边界：立春前不得误用次年太岁（曾按公历年号直取）；
 * 3. 年/月/日家 bigfish↔jelly 属不同流派（局数体系不同）——特征化锚定，
 *    上游算法变更时此处报警，与 docs/SCHOOLS.md 的口径说明保持同步。
 */
import { describe, expect, it } from 'vitest';
import { getQimenEngine, listQimenEngines } from '../registry';

describe('晚子时口径（2024-06-15 23:30，次日为辛亥）', () => {
  const late = new Date(2024, 5, 15, 23, 30);

  it('各引擎日柱与 lateZi 声明一致；时柱均为次日子时干（戊子）', () => {
    for (const e of listQimenEngines()) {
      const c = e.compute({ date: late, method: e.methods[0] });
      const expectDay = e.lateZi.includes('不换日') ? '庚戌' : '辛亥';
      expect(c.meta.siZhu.day, `${e.id} 日柱`).toBe(expectDay);
      expect(c.meta.siZhu.hour, `${e.id} 时柱`).toBe('戊子');
    }
  });
});

describe('bigfish 年/月家立春边界（2025-02-03 立春）', () => {
  const bigfish = getQimenEngine('bigfish');

  it('立春前（2025-01-15）太岁仍为甲辰，年家盘与 2024 年内一致', () => {
    const before = bigfish.compute({ date: new Date(2025, 0, 15, 10, 0), method: '拆补', layer: '年家' });
    const in2024 = bigfish.compute({ date: new Date(2024, 5, 15, 14, 30), method: '拆补', layer: '年家' });
    expect(before.meta.siZhu.year).toBe('甲辰');
    expect(before.meta.zhiFu).toBe(in2024.meta.zhiFu);
    expect(before.meta.zhiFuGong).toBe(in2024.meta.zhiFuGong);
    // 月家年柱同样校准
    const month = bigfish.compute({ date: new Date(2025, 0, 15, 10, 0), method: '拆补', layer: '月家' });
    expect(month.meta.siZhu.year).toBe('甲辰');
    expect(month.meta.siZhu.month).toBe('丁丑');
  });

  it('立春后（2025-02-15）换岁乙巳', () => {
    const after = bigfish.compute({ date: new Date(2025, 1, 15, 10, 0), method: '拆补', layer: '年家' });
    expect(after.meta.siZhu.year).toBe('乙巳');
  });

  it('层盘四柱采用精确历法：1990-11-08 08:00 已交立冬，月柱为丁亥（bigfish 内部曾按日粒度显丙戌）', () => {
    const day = bigfish.compute({ date: new Date(1990, 10, 8, 8, 0), method: '拆补', layer: '日家' });
    expect(day.meta.siZhu.month).toBe('丁亥');
    // 年/月家现在带完整年月日三柱，日干用神定位可用
    expect(day.meta.siZhu.day).toBe('丁丑');
    const year = bigfish.compute({ date: new Date(1990, 10, 8, 8, 0), method: '拆补', layer: '年家' });
    expect(year.meta.siZhu.day).toBe('丁丑');
  });
});

describe('年/月/日家流派差异特征化（bigfish↔jelly 不可互证，详见 docs/SCHOOLS.md）', () => {
  const d = new Date(2024, 5, 15, 14, 30);

  it('年家 2024（甲辰）：bigfish 三元大周期阴遁7局下元 vs jelly 立春锚阳遁2局下元', () => {
    const bf = getQimenEngine('bigfish').compute({ date: d, method: '拆补', layer: '年家' });
    const jl = getQimenEngine('jelly').compute({ date: d, method: '拆补', layer: '年家' });
    expect(`${bf.meta.dun}${bf.meta.ju}`).toBe('阴遁7');
    expect(`${jl.meta.dun}${jl.meta.ju}`).toBe('阳遁2');
    expect(jl.meta.juAnchorJieQi).toBe('立春');
    // 两家太岁年柱一致（历法层无分歧，分歧在定局法）
    expect(bf.meta.siZhu.year).toBe(jl.meta.siZhu.year);
  });

  it('jelly 非时家层 meta.jieQi 为当日实际节气，定局锚点归 juAnchorJieQi', () => {
    const jl = getQimenEngine('jelly').compute({ date: d, method: '拆补', layer: '年家' });
    expect(jl.meta.jieQi).toBe('芒种'); // 当日节气，不再显示锚点立春
    const month = getQimenEngine('jelly').compute({ date: d, method: '拆补', layer: '月家' });
    expect(month.meta.juAnchorJieQi).toBe('芒种'); // 月家锚点=该月之节
  });

  it('taobi 阴阳遁按节气表判定（芒种→阳遁，小暑→阴遁）', () => {
    const taobi = getQimenEngine('taobi');
    expect(taobi.compute({ date: d, method: '拆补' }).meta.dun).toBe('阳遁');
    expect(taobi.compute({ date: new Date(2024, 6, 15, 14, 30), method: '拆补' }).meta.dun).toBe('阴遁');
  });

  it('kinqimen 日空与时空分别标记（2024-06-15 14:30 日柱庚戌旬空寅卯→震3/艮8 日空）', () => {
    const c = getQimenEngine('kinqimen').compute({ date: d, method: '拆补' });
    const dayKongGongs = c.palaces.filter((p) => p.marks.includes('日空')).map((p) => p.gong);
    expect(dayKongGongs.length).toBeGreaterThan(0);
    for (const p of c.palaces) {
      if (p.marks.includes('日空')) expect([3, 8]).toContain(p.gong); // 寅辖艮8、卯辖震3
    }
  });
});
