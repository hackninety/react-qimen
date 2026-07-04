import { describe, expect, it } from 'vitest';
import { defaultSolarTimeSetting, equationOfTime, resolveSolarTime } from '../true-solar-time';

describe('均时差（Spencer 公式）', () => {
  it('全年幅度在 −15 ~ +17 分钟内且有正有负', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let day = 0; day < 365; day += 5) {
      const eot = equationOfTime(new Date(2024, 0, 1 + day, 12, 0));
      min = Math.min(min, eot);
      max = Math.max(max, eot);
    }
    expect(min).toBeGreaterThan(-15);
    expect(min).toBeLessThan(-10); // 2 月中旬约 −14 分钟
    expect(max).toBeLessThan(17);
    expect(max).toBeGreaterThan(12); // 11 月初约 +16 分钟
  });
});

describe('真太阳时解析', () => {
  const date = new Date(2024, 5, 15, 14, 30);

  it('未启用时原样返回输入时间', () => {
    const r = resolveSolarTime(date, defaultSolarTimeSetting());
    expect(r.applied).toBe(false);
    expect(r.date).toBe(date);
  });

  it('经度每差 1° 折合 4 分钟（与时区/均时差无关的相对不变量）', () => {
    const at = (lng: number) =>
      resolveSolarTime(date, { ...defaultSolarTimeSetting(), enabled: true, mode: 'manual', manualLongitude: lng });
    const a = at(120);
    const b = at(116.41); // 北京
    expect((b.offsetMinutes ?? 0) - (a.offsetMinutes ?? 0)).toBeCloseTo((116.41 - 120) * 4, 0);
    // 修正量与时间位移一致
    expect(b.date.getTime() - b.standardDate.getTime()).toBeCloseTo((b.offsetMinutes ?? 0) * 60_000, -2);
    // 明细自洽：总修正 = 经度修正 + 均时差
    expect(b.offsetMinutes).toBeCloseTo((b.longitudeCorrectionMinutes ?? 0) + (b.eotMinutes ?? 0), 0);
  });

  it('城市模式解析出地名与经度', () => {
    const r = resolveSolarTime(date, {
      enabled: true,
      mode: 'city',
      province: '北京',
      city: '北京',
      district: '海淀区',
      manualLongitude: 120,
    });
    expect(r.applied).toBe(true);
    expect(r.place).toContain('北京');
    expect(r.place).toContain('海淀区');
    expect(r.longitude).toBeCloseTo(116.31, 1);
  });
});
