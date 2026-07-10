import { describe, expect, it } from 'vitest';
import { getQimenEngine } from '@/engines/registry';
import { crossCheckChart } from '../cross-check';

const date = new Date(2024, 5, 15, 14, 30);

describe('多引擎交叉校验', () => {
  it('基准盘 sanmeta 拆补 ↔ bigfish 一致', () => {
    const chart = getQimenEngine('sanmeta').compute({ date, method: '拆补' });
    const r = crossCheckChart(chart, { date, method: '拆补' });
    expect(r).not.toBeNull();
    expect(r!.referenceId).toBe('bigfish');
    expect(r!.consistent, r!.diffs.join('；')).toBe(true);
  });

  it('bigfish 拆补的参照是 sanmeta；茅山的参照是 taobi', () => {
    const chaibu = getQimenEngine('bigfish').compute({ date, method: '拆补' });
    expect(crossCheckChart(chaibu, { date, method: '拆补' })?.referenceId).toBe('sanmeta');
    const maoshan = getQimenEngine('bigfish').compute({ date, method: '茅山' });
    expect(crossCheckChart(maoshan, { date, method: '茅山' })?.referenceId).toBe('taobi');
  });

  it('单引擎定局法（置闰/均分/鸣法）与年/月/日家（流派不同）无参照', () => {
    const zhirun = getQimenEngine('bigfish').compute({ date, method: '置闰' });
    expect(crossCheckChart(zhirun, { date, method: '置闰' })).toBeNull();
    const mingfa = getQimenEngine('mingfa').compute({ date, method: '鸣法' });
    expect(crossCheckChart(mingfa, { date, method: '鸣法' })).toBeNull();
    const year = getQimenEngine('bigfish').compute({ date, method: '拆补', layer: '年家' });
    expect(crossCheckChart(year, { date, method: '拆补', layer: '年家' })).toBeNull();
  });

  it('多时点扫描 sanmeta↔bigfish：局/值符/值使恒一致（宫位细节容差内）', () => {
    for (const d of [
      new Date(2024, 11, 22, 1, 30), // 冬至边界（曾暴露 taobi 符首中五宫问题的时点）
      new Date(2025, 0, 15, 10, 0),
      new Date(2026, 6, 10, 20, 0),
    ]) {
      const chart = getQimenEngine('sanmeta').compute({ date: d, method: '拆补' });
      const r = crossCheckChart(chart, { date: d, method: '拆补' });
      expect(r).not.toBeNull();
      const fatal = r!.diffs.filter((x) => x.startsWith('局') || x.startsWith('值'));
      expect(fatal, `${d.toISOString()} ${fatal.join('；')}`).toHaveLength(0);
    }
  });
});
