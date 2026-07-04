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
