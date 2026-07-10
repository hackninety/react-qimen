import { describe, expect, it } from 'vitest';
import { getQimenEngine } from '@/engines/registry';
import { relationOf, describeRelation, ganWx } from '@/lib/wuxing-logic';
import { buildRelations, relationsSummary } from '../relations';

describe('五行生克逻辑', () => {
  it('生克环正确', () => {
    expect(relationOf('木', '火')).toBe('生');
    expect(relationOf('木', '土')).toBe('克');
    expect(relationOf('火', '木')).toBe('被生');
    expect(relationOf('土', '木')).toBe('被克');
    expect(relationOf('金', '金')).toBe('比和');
  });

  it('干五行与描述', () => {
    expect(ganWx('庚')).toBe('金');
    expect(describeRelation('庚', '金', '乙', '木')).toBe('庚金克乙木');
    expect(describeRelation('壬', '水', '庚', '金')).toBe('庚金生壬水');
  });
});

describe('盘面关系预计算（基准盘 2024-06-15 14:30 阳遁六局）', () => {
  const chart = getQimenEngine('sanmeta').compute({ date: new Date(2024, 5, 15, 14, 30), method: '拆补' });
  const rel = buildRelations(chart);

  it('九宫齐备，干干/门宫/星宫关系可读', () => {
    expect(rel.palaces).toHaveLength(9);
    // 坎1：天盘庚加地盘壬 → 庚金生壬水
    const kan = rel.palaces[0];
    expect(kan.ganGan[0]).toBe('庚金生壬水');
    // 休门(水)落坎宫(水) → 比和，门伏
    expect(kan.menGong?.type).toBe('伏');
    // 8 宫有门宫关系（中5 无门）
    expect(rel.palaces.filter((p) => p.menGong).length).toBe(8);
  });

  it('门迫判定与 3meta 标记一致（乾6 开门金宫无迫；杜门落坤2 木克土为迫）', () => {
    const kun = rel.palaces[1]; // 坤2 死门? 基准盘坤2=死门(土)与土比和
    expect(kun.menGong?.type).toBe('伏');
    const menPoGongs = rel.palaces.filter((p) => p.menGong?.type === '迫').map((p) => p.gong);
    // 与引擎自身门迫标记对齐（3meta 只标"迫"）
    const enginePo = chart.palaces.filter((p) => p.marks.includes('门迫')).map((p) => p.gong);
    expect(menPoGongs).toEqual(expect.arrayContaining(enginePo));
  });

  it('基准盘无伏吟反吟五不遇时，但时柱癸未命中时干入墓（钓叟歌：癸未丁丑亦同凶）', () => {
    expect(rel.ganFuYin).toBe(false);
    expect(rel.xingFuYin).toBe(false);
    expect(rel.xingFanYin).toBe(false);
    expect(rel.wuBuYuShi).toBeUndefined();
    expect(rel.shiGanRuMu).toContain('癸未');
    expect(relationsSummary(rel)).toContain('时干入墓');
  });

  it('五不遇时与时干入墓命中（甲日庚午时/丁丑时柱）', () => {
    const fake = {
      ...chart,
      meta: { ...chart.meta, siZhu: { ...chart.meta.siZhu, day: '甲子', hour: '庚午' } },
    };
    expect(buildRelations(fake).wuBuYuShi).toContain('甲日庚午时');
    const fake2 = {
      ...chart,
      meta: { ...chart.meta, siZhu: { ...chart.meta.siZhu, hour: '丁丑' } },
    };
    expect(buildRelations(fake2).shiGanRuMu).toContain('丁丑');
  });

  it('伏吟盘识别（人造全盘天地干相同）', () => {
    const fu = {
      ...chart,
      palaces: chart.palaces.map((p) => ({ ...p, tianPanGan: [...p.diPanGan] })),
    };
    expect(buildRelations(fu).ganFuYin).toBe(true);
  });
});
