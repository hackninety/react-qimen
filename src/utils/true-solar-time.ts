/**
 * 真太阳时校正
 *
 * 真太阳时 = 输入墙上钟时间 − 解释时区偏移 + 经度×4分钟 + 均时差
 *
 * - 输入时间按浏览器时区解释（在中国即北京时间 UTC+8，经度基准 120°E）；
 * - 经度修正：每偏离时区基准经线 1° 折合 4 分钟；
 * - 均时差（Equation of Time）：地球椭圆轨道 + 黄赤交角导致的真/平太阳日差，
 *   采用 Spencer (1971) 近似公式，精度约 ±30 秒，全年幅度约 −14 ~ +16 分钟。
 *
 * 参考 react-taiyi/src/taiyi/solartime.ts（时区解释与城市定位）
 * 与 react-liuren/src/utils/true-solar-time.ts（均时差项）。
 */
import { PROVINCES } from '@/lib/cities';

export type SolarTimeMode = 'auto' | 'city' | 'manual';

export interface SolarTimeSetting {
  enabled: boolean;
  mode: SolarTimeMode;
  province: string;
  city: string;
  district: string;
  /** 手动模式经度（东经为正） */
  manualLongitude: number;
}

export interface SolarTimeResult {
  applied: boolean;
  /** 地名（城市模式为省市区，自动模式为时区代表城市，手动模式为经度描述） */
  place?: string;
  /** 东经为正 */
  longitude?: number;
  /** 输入时间的解释时区（浏览器 IANA 时区） */
  timezone?: string;
  /** 解释时区偏移（分钟，东为正） */
  tzOffsetMinutes?: number;
  /** 经度修正分钟（经度×4 − 时区偏移） */
  longitudeCorrectionMinutes?: number;
  /** 均时差分钟 */
  eotMinutes?: number;
  /** 总修正分钟 */
  offsetMinutes?: number;
  /** 输入的标准钟表时间 */
  standardDate: Date;
  /** 排盘时间（启用时为真太阳时，否则等于输入时间） */
  date: Date;
}

export function defaultSolarTimeSetting(): SolarTimeSetting {
  return { enabled: false, mode: 'city', province: '北京', city: '北京', district: '市区', manualLongitude: 120 };
}

/** 常见 IANA 时区 → 代表城市与经度（自动模式用），未收录时回退时区标准经线 */
const TZ_CITY: Record<string, { label: string; longitude: number }> = {
  'Asia/Shanghai': { label: '上海', longitude: 121.47 },
  'Asia/Chongqing': { label: '重庆', longitude: 106.55 },
  'Asia/Urumqi': { label: '乌鲁木齐', longitude: 87.62 },
  'Asia/Hong_Kong': { label: '香港', longitude: 114.17 },
  'Asia/Macau': { label: '澳门', longitude: 113.55 },
  'Asia/Taipei': { label: '台北', longitude: 121.56 },
  'Asia/Tokyo': { label: '东京', longitude: 139.69 },
  'Asia/Seoul': { label: '首尔', longitude: 126.98 },
  'Asia/Singapore': { label: '新加坡', longitude: 103.85 },
  'Asia/Kuala_Lumpur': { label: '吉隆坡', longitude: 101.69 },
  'Asia/Bangkok': { label: '曼谷', longitude: 100.5 },
  'Asia/Manila': { label: '马尼拉', longitude: 120.98 },
  'Asia/Jakarta': { label: '雅加达', longitude: 106.85 },
  'Asia/Kolkata': { label: '新德里', longitude: 77.21 },
  'Asia/Dubai': { label: '迪拜', longitude: 55.27 },
  'Australia/Sydney': { label: '悉尼', longitude: 151.21 },
  'Europe/London': { label: '伦敦', longitude: -0.13 },
  'Europe/Paris': { label: '巴黎', longitude: 2.35 },
  'Europe/Berlin': { label: '柏林', longitude: 13.4 },
  'Europe/Moscow': { label: '莫斯科', longitude: 37.62 },
  'America/New_York': { label: '纽约', longitude: -74.01 },
  'America/Chicago': { label: '芝加哥', longitude: -87.63 },
  'America/Denver': { label: '丹佛', longitude: -104.99 },
  'America/Los_Angeles': { label: '洛杉矶', longitude: -118.24 },
  'America/Vancouver': { label: '温哥华', longitude: -123.12 },
  'America/Toronto': { label: '多伦多', longitude: -79.38 },
  'Pacific/Auckland': { label: '奥克兰', longitude: 174.76 },
};

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

/** 均时差（分钟）— Spencer (1971) 近似公式 */
export function equationOfTime(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** 按设置解析地点：返回地名与经度 */
function resolveLocation(setting: SolarTimeSetting, date: Date): { place: string; longitude: number } {
  if (setting.mode === 'manual') {
    const lng = setting.manualLongitude;
    return { place: `${lng >= 0 ? '东经' : '西经'}${Math.abs(lng).toFixed(2)}°`, longitude: lng };
  }
  if (setting.mode === 'auto') {
    const tz = browserTimeZone();
    const hit = TZ_CITY[tz];
    if (hit) return { place: hit.label, longitude: hit.longitude };
    const meridian = Math.round((-date.getTimezoneOffset() / 60) * 15 * 100) / 100;
    return { place: `${tz || '本地时区'}标准经线`, longitude: meridian };
  }
  // city 模式：省 → 市 → 区县
  const province = PROVINCES.find((p) => p.name === setting.province);
  const city = province?.cities.find((c) => c.name === setting.city);
  const district = city?.districts.find((d) => d.name === setting.district) ?? city?.districts[0];
  const longitude = district?.longitude ?? 120;
  const place = [setting.province, setting.city !== setting.province ? setting.city : '', district?.name ?? '']
    .filter(Boolean)
    .join(' ');
  return { place, longitude };
}

/** 真太阳时解析（纯函数）：未启用时原样返回输入时间 */
export function resolveSolarTime(standardDate: Date, setting: SolarTimeSetting): SolarTimeResult {
  if (!setting.enabled) return { applied: false, standardDate, date: standardDate };

  const { place, longitude } = resolveLocation(setting, standardDate);
  const tzOffsetMinutes = -standardDate.getTimezoneOffset();
  const longitudeCorrectionMinutes = longitude * 4 - tzOffsetMinutes;
  const eotMinutes = equationOfTime(standardDate);
  const offsetMinutes = Math.round((longitudeCorrectionMinutes + eotMinutes) * 10) / 10;

  return {
    applied: true,
    place,
    longitude,
    timezone: browserTimeZone(),
    tzOffsetMinutes,
    longitudeCorrectionMinutes: Math.round(longitudeCorrectionMinutes * 10) / 10,
    eotMinutes: Math.round(eotMinutes * 10) / 10,
    offsetMinutes,
    standardDate,
    date: new Date(standardDate.getTime() + offsetMinutes * 60_000),
  };
}

/** 修正量文本，如 "+12.3 分钟" / "−13.0 分钟" */
export function formatOffset(minutes: number): string {
  return `${minutes >= 0 ? '+' : '−'}${Math.abs(minutes).toFixed(1)} 分钟`;
}
