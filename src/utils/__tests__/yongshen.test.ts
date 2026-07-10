import { describe, expect, it } from 'vitest';
import { getQimenEngine } from '@/engines/registry';
import { TOPICS } from '@/lib/yongshen-rules';
import { locateYongShen } from '../yongshen';

// 基准盘 2024-06-15 14:30 阳遁六局：日干庚(天盘庚在坎1)、时干癸(天盘癸在离9)
const chart = getQimenEngine('sanmeta').compute({ date: new Date(2024, 5, 15, 14, 30), method: '拆补' });

describe('用神定位（基准盘）', () => {
  it('求财：日干/时干/生门/戊 全部定位正确', () => {
    const r = locateYongShen(chart, '求财');
    const by = (role: string) => r.entries.find((e) => e.role.includes(role));
    expect(by('日干')?.symbol).toBe('庚');
    expect(by('日干')?.gong).toBe(1); // 天盘庚落坎1
    expect(by('时干')?.gong).toBe(9); // 天盘癸落离9
    expect(by('财门')?.gong).toBe(8); // 生门落艮8
    expect(by('钱财')?.gong).toBe(7); // 天盘戊落兑7
    // 状态字段齐备
    const cai = by('财门')!;
    expect(cai.direction).toBe('东北');
    expect(cai.cohabit).toContain('生门');
    expect(cai.gongRelation).toBeTruthy();
    expect(cai.vsDayGong).toBeTruthy();
  });

  it('疾病：天芮星定位（禽芮并宫也可命中）', () => {
    const r = locateYongShen(chart, '疾病');
    const rui = r.entries.find((e) => e.role.includes('病症'));
    expect(rui?.gong).toBe(9); // 基准盘天芮(与禽同宫)落离9
    const yi = r.entries.find((e) => e.role.includes('医生'));
    expect(yi?.gong).toBe(9); // 天盘乙落离9（乙癸并飞）
  });

  it('综合：值符神与值使门定位', () => {
    const r = locateYongShen(chart, '综合');
    expect(r.entries.find((e) => e.role.includes('值符'))?.gong).toBe(2);
    const zhiShi = r.entries.find((e) => e.role.includes('值使'));
    expect(zhiShi?.symbol).toBe('惊门');
    expect(zhiShi?.gong).toBe(7);
  });

  it('日干为甲时按遁仪替换定位', () => {
    const fake = { ...chart, meta: { ...chart.meta, siZhu: { ...chart.meta.siZhu, day: '甲子' } } };
    const r = locateYongShen(fake, '综合');
    const day = r.entries.find((e) => e.role.includes('日干'));
    expect(day?.symbol).toBe('甲(遁戊)');
    expect(day?.gong).toBe(7); // 天盘戊在兑7
  });

  it('全部占类跑通且无异常缺失（除引擎能力外）', () => {
    for (const t of TOPICS) {
      const r = locateYongShen(chart, t.id);
      expect(r.entries.length).toBeGreaterThanOrEqual(3);
      // 基准盘三奇六仪/八门/八神齐备，不应有 missing
      for (const e of r.entries) expect(e.missing, `${t.id}·${e.role}`).not.toBe(true);
    }
  });

  it('年命：1990 庚午年生 → 干庚落坎1（与日干同宫），年支午辖离9', () => {
    const r = locateYongShen(chart, '综合', { birthYear: 1990 });
    const nm = r.entries.find((e) => e.role.includes('年命'));
    expect(nm?.symbol).toContain('庚午');
    expect(nm?.gong).toBe(1);
    expect(nm?.vsDayGong).toContain('同宫');
    expect(nm?.note).toBe('年支午辖9宫');
  });

  it('年命甲年（1984 甲子）按遁仪替换：遁戊落兑7', () => {
    const r = locateYongShen(chart, '综合', { birthYear: 1984 });
    const nm = r.entries.find((e) => e.role.includes('年命'));
    expect(nm?.symbol).toContain('甲子');
    expect(nm?.symbol).toContain('遁戊');
    expect(nm?.gong).toBe(7);
  });

  it('不传生年时无年命行', () => {
    const r = locateYongShen(chart, '综合');
    expect(r.entries.some((e) => e.role.includes('年命'))).toBe(false);
  });
});
