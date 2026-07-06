import { describe, expect, it } from 'vitest';
import { getQimenEngine } from '@/engines/registry';
import { chartToJson, chartToMarkdown } from '../export';
import { defaultSolarTimeSetting, resolveSolarTime } from '../true-solar-time';

const date = new Date(2024, 5, 15, 14, 30);
const engine = getQimenEngine('sanmeta');
const chart = engine.compute({ date, method: '拆补' });

describe('Markdown 导出', () => {
  it('包含口径、四柱、局数、九宫表与引擎声明', () => {
    const solar = resolveSolarTime(date, defaultSolarTimeSetting());
    const md = chartToMarkdown(chart, engine, solar);
    expect(md).toContain('时家转盘 · 拆补法');
    expect(md).toContain('庚戌');
    expect(md).toContain('阳遁6局');
    expect(md).toContain('值符 天柱');
    expect(md).toContain('| 坎1·正北 |');
    expect(md).toContain('npm: 3meta');
    expect(md).toContain('未启用真太阳时');
  });

  it('启用真太阳时后包含地点与修正明细', () => {
    const solar = resolveSolarTime(date, {
      enabled: true, mode: 'city', province: '广东', city: '潮州', district: '市区', manualLongitude: 120,
    });
    const solarChart = engine.compute({ date: solar.date, method: '拆补' });
    const md = chartToMarkdown(solarChart, engine, solar);
    expect(md).toContain('真太阳时');
    expect(md).toContain('潮州');
    expect(md).toContain('均时差');
    expect(md).toContain('东经');
  });

  it('MD 比 JSON 更省字符', () => {
    const solar = resolveSolarTime(date, defaultSolarTimeSetting());
    const md = chartToMarkdown(chart, engine, solar);
    const json = chartToJson(chart, engine, solar);
    expect(md.length).toBeLessThan(json.length);
  });
});

describe('典籍参考随导出输出', () => {
  const refs = [
    { kind: '十干克应' as const, key: '戊+丙', gong: 4 as const, name: '青龙返首', text: '动作大吉，若逢迫、墓、击、刑，吉事成凶。', docPath: 'qmmj/book/juan02.md' },
    { kind: '九星值时' as const, key: '天蓬值未时', text: '值未入宅凶……', docPath: 'qmmj/book/juan17.md' },
  ];

  it('MD 含典籍参考段与格局断语全文', () => {
    const solar = resolveSolarTime(date, defaultSolarTimeSetting());
    const md = chartToMarkdown(chart, engine, solar, refs);
    expect(md).toContain('## 典籍参考（《奇門遁甲秘笈大全》2 条）');
    expect(md).toContain('### 十干克应');
    expect(md).toContain('**戊+丙**「青龙返首」（4宫）：动作大吉');
    // 格局断语全文随 MD 输出（完整盘面）
    const withNote = chart.patterns?.find((p) => p.note);
    if (withNote) expect(md).toContain(withNote.note!.split('\n')[0]);
  });

  it('JSON 含典籍参考条目', () => {
    const solar = resolveSolarTime(date, defaultSolarTimeSetting());
    const parsed = JSON.parse(chartToJson(chart, engine, solar, refs));
    expect(parsed['典籍参考']['条目']).toHaveLength(2);
    expect(parsed['典籍参考']['条目'][0]['格名']).toBe('青龙返首');
    expect(parsed['典籍参考']['条目'][0]['出处']).toBe('qmmj/book/juan02.md');
  });
});

describe('JSON 导出', () => {
  it('结构完整且可解析，含排盘口径与九宫', () => {
    const solar = resolveSolarTime(date, defaultSolarTimeSetting());
    const parsed = JSON.parse(chartToJson(chart, engine, solar));
    expect(parsed['排盘口径']['引擎']['npm包']).toBe('3meta');
    expect(parsed['九宫']).toHaveLength(9);
    expect(parsed['局']['值符']).toBe('天柱');
    expect(parsed['真太阳时']['启用']).toBe(false);
    expect(parsed['时间']['四柱']['day']).toBe('庚戌');
  });
});
