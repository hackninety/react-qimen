import { describe, expect, it } from 'vitest';
import { getQimenEngine } from '@/engines/registry';
import { ARCHIVE_MAX, insertEntry, isArchiveList, makeArchiveEntry, removeEntry, type ArchiveEntry, type ArchiveInput } from '../archive';
import { diffCharts } from '../cross-check';
import { defaultSolarTimeSetting } from '../true-solar-time';

const date = new Date(2024, 5, 15, 14, 30);
const chart = getQimenEngine('sanmeta').compute({ date, method: '拆补' });

const input: ArchiveInput = {
  dateStr: '2024-06-15T14:30',
  layer: '时家',
  engineId: 'sanmeta',
  method: '拆补',
  solarSetting: defaultSolarTimeSetting(),
  topicId: '求财',
  subject: '合作',
  birthYear: '1990',
};

describe('历史盘存档', () => {
  it('条目含参数与摘要快照（局/值符值使/四柱），id 唯一', () => {
    const e = makeArchiveEntry(input, chart);
    expect(e.summary).toContain('阳遁6局');
    expect(e.summary).toContain('值符天柱');
    expect(e.summary).toContain('庚戌');
    expect(e.dateStr).toBe('2024-06-15T14:30');
    const e2 = makeArchiveEntry(input, chart);
    expect(e2.id).not.toBe(e.id);
  });

  it('头插且按上限截断（最新在前）', () => {
    let list: ArchiveEntry[] = [];
    for (let i = 0; i < ARCHIVE_MAX + 5; i++) {
      list = insertEntry(list, { ...makeArchiveEntry(input, chart), id: `id-${i}` });
    }
    expect(list).toHaveLength(ARCHIVE_MAX);
    expect(list[0].id).toBe(`id-${ARCHIVE_MAX + 4}`);
  });

  it('删除与校验器', () => {
    const e = makeArchiveEntry(input, chart);
    expect(removeEntry([e], e.id)).toHaveLength(0);
    expect(isArchiveList([e])).toBe(true);
    expect(isArchiveList([{ bad: 1 }])).toBe(false);
    expect(isArchiveList('nope')).toBe(false);
  });
});

describe('diffCharts（对照视图基础）', () => {
  it('同口径 sanmeta↔bigfish 基准盘一致，差异宫集为空', () => {
    const other = getQimenEngine('bigfish').compute({ date, method: '拆补' });
    const d = diffCharts(chart, other);
    expect(d.consistent, d.diffs.join('；')).toBe(true);
    expect(d.gongs.size).toBe(0);
  });

  it('跨流派 sanmeta↔mingfa（飞盘）差异非空且差异宫可高亮', () => {
    const mingfa = getQimenEngine('mingfa').compute({ date, method: '鸣法' });
    const d = diffCharts(chart, mingfa);
    expect(d.consistent).toBe(false);
    expect(d.diffs.length).toBeGreaterThan(0);
    expect(d.gongs.size).toBeGreaterThan(0);
    for (const g of d.gongs) expect(g).toBeGreaterThanOrEqual(1);
  });
});
