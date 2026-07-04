/**
 * qimen-mingfa 适配器 —— 飞盘 · 鸣法
 * https://github.com/Richardge885/qimen-refactor （MIT）
 * 鸣法飞盘流派：九星只顺不逆、交节定元、天地盘双神、六亲/十神/神煞体系
 */
import { paipan } from 'qimen-mingfa';
import { getCalendarContext } from '../calendar';
import type {
  ComputeInput,
  GongIndex,
  PalaceInfo,
  PalaceMark,
  PatternHit,
  QimenEngine,
  UnifiedQimenChart,
} from '../types';

/** 鸣法宫位键 → 洛书宫号 */
const GONG_KEYS: [string, GongIndex][] = [
  ['kanGong', 1], ['kunGong', 2], ['zhenGong', 3], ['xunGong', 4], ['zhongGong', 5],
  ['qianGong', 6], ['duiGong', 7], ['genGong', 8], ['liGong', 9],
];

interface MingfaGong {
  baGua: string;
  gongWangShuai: string;
  maXing: boolean;
  gongKong: boolean;
  tianPanYiKong: boolean;
  diPanYiKong: boolean;
  tianPanShen: string;
  diPanShen: string;
  xing: string;
  men: string;
  tianPanGan: string;
  diPanGan: string;
  anGan: string;
  anZhi: string;
  zhengGe: string[];
  tianPanGanLiuQin: string;
  diPanGanLiuQin: string;
  shenSha: string[];
  fuGe: { ganGong: string; menGong: string; xingGong: string };
}

const firstLine = (s: string) => s.split('\n')[0]?.trim() ?? s;

function compute({ date }: ComputeInput): UnifiedQimenChart {
  const ctx = getCalendarContext(date);
  const r = paipan({
    time: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    },
    additionalSettings: { traditionalCharacters: false, singleCharacter: false },
  }) as unknown as {
    allTimeInformation: {
      nianzhu: string; yuezhu: string; rizhu: string; shizhu: string;
      jieqi: string; dun: string; jushu: string;
    };
    xunShou: string;
    zhiFu: string;
    zhiShi: string;
    panJuResult: Record<string, MingfaGong>;
  };

  const patterns: PatternHit[] = [];
  const palaces: PalaceInfo[] = GONG_KEYS.map(([key, gong]) => {
    const g = r.panJuResult[key];
    const marks: PalaceMark[] = [];
    if (g.gongKong) marks.push('空亡');
    if (g.maXing) marks.push('马星');

    const extras: Record<string, string> = {};
    if (g.diPanShen) extras['地神'] = g.diPanShen;
    if (g.gongWangShuai) extras['旺衰'] = g.gongWangShuai;
    if (g.tianPanGanLiuQin) extras['天亲'] = g.tianPanGanLiuQin;
    if (g.diPanGanLiuQin) extras['地亲'] = g.diPanGanLiuQin;
    if (g.tianPanYiKong) extras['天仪'] = '仪空';
    if (g.diPanYiKong) extras['地仪'] = '仪空';
    if (g.shenSha.length) extras['神煞'] = g.shenSha.map((s) => s.split(/[:：]/)[0]).join('·');

    for (const ge of g.zhengGe) {
      patterns.push({ name: firstLine(ge), gong, note: ge.split('\n').slice(1).join('\n') || undefined });
    }
    for (const fu of [g.fuGe.ganGong, g.fuGe.menGong, g.fuGe.xingGong]) {
      if (fu) patterns.push({ name: firstLine(fu), gong, note: fu.split('\n').slice(1).join('\n') || undefined });
    }

    return {
      gong,
      diPanGan: [g.diPanGan].filter(Boolean),
      tianPanGan: [g.tianPanGan].filter(Boolean),
      star: g.xing || undefined,
      gate: g.men || undefined,
      god: g.tianPanShen || undefined,
      hiddenGan: g.anGan || undefined,
      marks,
      extras: Object.keys(extras).length ? extras : undefined,
    };
  });

  const info = r.allTimeInformation;
  return {
    engineId: 'mingfa',
    school: '飞盘鸣法',
    method: '鸣法',
    meta: {
      siZhu: { year: info.nianzhu, month: info.yuezhu, day: info.rizhu, hour: info.shizhu },
      jieQi: info.jieqi,
      dun: info.dun === '阴' ? '阴遁' : '阳遁',
      ju: Number(info.jushu) || 0,
      xunShou: r.xunShou,
      fuShou: ctx.fuShou,
      zhiFu: r.zhiFu,
      zhiShi: r.zhiShi,
      zhiFuGong: palaces.find((p) => p.god === '值符')?.gong,
      zhiShiGong: palaces.find((p) => p.gate === r.zhiShi)?.gong,
      kongWang: ctx.hourKong,
      maXing: ctx.yiMa,
      solarText: ctx.solarText,
      lunarText: ctx.lunarText,
    },
    palaces,
    patterns,
    raw: r,
  };
}

export const mingfaEngine: QimenEngine = {
  id: 'mingfa',
  name: '鸣法 Mingfa',
  school: '飞盘鸣法',
  methods: ['鸣法'],
  pkg: 'qimen-mingfa',
  license: 'MIT',
  homepage: 'https://github.com/Richardge885/qimen-refactor',
  notes: '飞盘奇门鸣法流派：交节定元、天地双神、格局断语、六亲十神、神煞体系',
  capabilities: ['格局', '暗干', '旺衰', '马星', '空亡'],
  compute,
};
