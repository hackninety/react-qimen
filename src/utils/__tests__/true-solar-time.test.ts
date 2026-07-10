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

  it('城市模式恒按 UTC+8 解释输入，与运行环境时区无关（东京浏览器选中国城市不再多扣 60 分钟）', () => {
    const r = resolveSolarTime(date, {
      enabled: true, mode: 'city', province: '广东', city: '潮州', district: '市区', manualLongitude: 120,
    });
    expect(r.tzOffsetMinutes).toBe(480);
    expect(r.timezone).toBe('中国标准时间 UTC+8');
    // 潮州 ≈116.62°E：经度修正 = 116.62×4 − 480 ≈ −13.5 分钟（固定值，不随机器时区漂移）
    expect(r.longitudeCorrectionMinutes).toBeCloseTo(116.62 * 4 - 480, 0);
  });

  it('自动/手动模式仍按浏览器时区解释输入（操作者本地钟表时间）', () => {
    const r = resolveSolarTime(date, { ...defaultSolarTimeSetting(), enabled: true, mode: 'manual', manualLongitude: 139.69 });
    expect(r.tzOffsetMinutes).toBe(-date.getTimezoneOffset());
    expect(r.timezone).not.toBe('中国标准时间 UTC+8');
  });
});
