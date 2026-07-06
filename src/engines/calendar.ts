/**
 * 共享历法上下文 —— 基于 lunar-typescript
 *
 * 部分算法库（bigfishmarquis-qimen / taobi）只做排盘核心，四柱、节气、
 * 旬首等历法信息需要外部提供，统一由本文件计算，保证各引擎展示口径一致。
 */
import { Solar } from 'lunar-typescript';
import { TIAN_GAN, DI_ZHI, type GongIndex, type PalaceInfo } from './types';

/** 六甲旬首 → 符首（甲所遁六仪） */
export const XUN_TO_FUSHOU: Record<string, string> = {
  甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸',
};

/** 六甲旬首 → 旬空地支 */
export const XUN_TO_KONG: Record<string, [string, string]> = {
  甲子: ['戌', '亥'], 甲戌: ['申', '酉'], 甲申: ['午', '未'],
  甲午: ['辰', '巳'], 甲辰: ['寅', '卯'], 甲寅: ['子', '丑'],
};

/** 宫位所辖地支（八宫，中五无支） */
export const PALACE_BRANCHES: Partial<Record<GongIndex, string[]>> = {
  1: ['子'], 8: ['丑', '寅'], 3: ['卯'], 4: ['辰', '巳'],
  9: ['午'], 2: ['未', '申'], 7: ['酉'], 6: ['戌', '亥'],
};

/** 八门本位宫 */
export const GATE_ORIGINAL: Partial<Record<GongIndex, string>> = {
  1: '休门', 8: '生门', 3: '伤门', 4: '杜门', 9: '景门', 2: '死门', 7: '惊门', 6: '开门',
};

/** 三合驿马：本支（时/日/月/年支）→ 马星地支 */
const YI_MA: Record<string, string> = {
  申: '寅', 子: '寅', 辰: '寅',
  寅: '申', 午: '申', 戌: '申',
  巳: '亥', 酉: '亥', 丑: '亥',
  亥: '巳', 卯: '巳', 未: '巳',
};

/** 按地支取三合驿马（年/月/日家按对应柱支取马） */
export function yiMaOf(zhi: string): string {
  return YI_MA[zhi] ?? '';
}

/** 干支 → 六十甲子序号（0-59） */
export function jiaZiIndex(ganZhi: string): number {
  const g = TIAN_GAN.indexOf(ganZhi[0] as (typeof TIAN_GAN)[number]);
  const z = DI_ZHI.indexOf(ganZhi[1] as (typeof DI_ZHI)[number]);
  if (g < 0 || z < 0) return -1;
  for (let i = g; i < 60; i += 10) {
    if (i % 12 === z) return i;
  }
  return -1;
}

/** 干支的旬首 */
export function xunShouOf(ganZhi: string): string {
  const idx = jiaZiIndex(ganZhi);
  if (idx < 0) return '';
  const head = idx - (idx % 10);
  return TIAN_GAN[head % 10] + DI_ZHI[head % 12];
}

export interface CalendarContext {
  siZhu: { year: string; month: string; day: string; hour: string };
  /** 当前所处节气名 */
  jieQi: string;
  /** 交节时刻 */
  jieQiTime: Date;
  /** 距交节小时数（茅山法用） */
  elapsedHours: number;
  /** 距交节天数（置闰法用） */
  daysSinceJieQi: number;
  /** 日干支六十甲子序号（置闰法用） */
  dayGzIndex: number;
  hourGan: string;
  hourZhi: string;
  /** 节气月序（寅=1 … 丑=12），月家定局用 */
  solarMonthOrdinal: number;
  /** 时旬首 */
  xunShou: string;
  /** 符首 */
  fuShou: string;
  /** 时旬空 */
  hourKong: [string, string];
  /** 驿马（按时支三合） */
  yiMa: string;
  solarText: string;
  lunarText: string;
}

export function getCalendarContext(date: Date): CalendarContext {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  const year = lunar.getYearInGanZhiExact();
  const month = lunar.getMonthInGanZhiExact();
  const day = lunar.getDayInGanZhi();
  const hour = lunar.getTimeInGanZhi();

  const jq = lunar.getPrevJieQi(true);
  const js = jq.getSolar();
  const jieQiTime = new Date(js.getYear(), js.getMonth() - 1, js.getDay(), js.getHour(), js.getMinute(), js.getSecond());
  const elapsedMs = date.getTime() - jieQiTime.getTime();

  const xunShou = xunShouOf(hour);
  const hourZhi = hour[1];
  // 节气月序：寅=正月(1) … 丑=十二月(12)，月家定局用
  const monthBranchIdx = DI_ZHI.indexOf(month[1] as (typeof DI_ZHI)[number]);
  const solarMonthOrdinal = monthBranchIdx < 0 ? 1 : ((monthBranchIdx - 2 + 12) % 12) + 1;

  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    siZhu: { year, month, day, hour },
    jieQi: jq.getName(),
    jieQiTime,
    elapsedHours: elapsedMs / 3_600_000,
    daysSinceJieQi: Math.floor(elapsedMs / 86_400_000),
    dayGzIndex: jiaZiIndex(day),
    hourGan: hour[0],
    hourZhi,
    solarMonthOrdinal,
    xunShou,
    fuShou: XUN_TO_FUSHOU[xunShou] ?? '',
    hourKong: XUN_TO_KONG[xunShou] ?? ['', ''],
    yiMa: YI_MA[hourZhi] ?? '',
    solarText: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
    lunarText: `${lunar.toString()} ${hour}时`,
  };
}

/** 按旬空/驿马地支为宫位补充「空亡」「马星」标记（供不输出标记的引擎使用） */
export function markKongMa(palaces: PalaceInfo[], kongBranches: string[], maBranch: string): void {
  for (const p of palaces) {
    const branches = PALACE_BRANCHES[p.gong];
    if (!branches) continue;
    if (kongBranches.some((b) => branches.includes(b)) && !p.marks.includes('空亡')) p.marks.push('空亡');
    if (maBranch && branches.includes(maBranch) && !p.marks.includes('马星')) p.marks.push('马星');
  }
}
