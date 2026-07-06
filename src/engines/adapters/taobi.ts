/**
 * taobi 适配器 —— 时家转盘 · 拆补/茅山/均分
 * https://github.com/Taogram/taobi （MPL-2.0）
 * VSOP87D 天文算法节气（精确到分钟），均分法为其原创定局法
 */
import { TheArtOfBecomingInvisible } from 'taobi';
import { GATE_ORIGINAL, getCalendarContext, markKongMa } from '../calendar';
import { LUOSHU_GRID } from '../types';
import type {
  ComputeInput,
  JuMethod,
  PalaceInfo,
  QimenEngine,
  UnifiedQimenChart,
} from '../types';

/** taobi options.elements：0 均分 / 1 拆补 / 2 茅山 */
const METHOD_TO_ELEMENTS: Partial<Record<JuMethod, number>> = {
  均分: 0, 拆补: 1, 茅山: 2,
};

const splitCsv = (s: string) => (s ?? '').split(/[,，]/).map((v) => v.trim()).filter(Boolean);

function compute({ date, method }: ComputeInput): UnifiedQimenChart {
  const ctx = getCalendarContext(date);
  const t = new TheArtOfBecomingInvisible(date, undefined, undefined, undefined, {
    elements: METHOD_TO_ELEMENTS[method] ?? 1,
  });
  const canvas = t.getCanvas();

  const palaces: PalaceInfo[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const gong = LUOSHU_GRID[row][col];
      const cell = canvas[row][col] as unknown as string[][];
      const [godRow, gateRow, starRow] = cell;
      palaces.push({
        gong,
        diPanGan: splitCsv(starRow?.[2] ?? ''),
        tianPanGan: splitCsv(gateRow?.[2] ?? ''),
        star: splitCsv(starRow?.[0] ?? '').map((s) => s.replace(/星$/, '')).join('/') || undefined,
        gate: gateRow?.[0] || undefined,
        god: godRow?.[0] || undefined,
        marks: [],
      });
    }
  }
  palaces.sort((a, b) => a.gong - b.gong);

  // 符首地盘落宫决定值符星与值使门；落中五宫时寄坤二（值符=天禽、值使=死门）
  let fuShouGong = palaces.find((p) => p.gong !== 5 && p.diPanGan.includes(ctx.fuShou))?.gong;
  let fuShouInCenter = false;
  if (!fuShouGong && palaces[4].diPanGan.includes(ctx.fuShou)) {
    fuShouGong = 2;
    fuShouInCenter = true;
  }
  const zhiFuPalace = palaces.find((p) => p.god === '值符');
  // 值符落宫的星可能是「天芮/天禽」并写：符首在中宫时值符为天禽，否则为该宫首星
  const zhiFu = fuShouInCenter ? '天禽' : zhiFuPalace?.star?.split('/')[0];
  const zhiShi = fuShouGong ? GATE_ORIGINAL[fuShouGong] : undefined;
  const zhiShiGong = zhiShi ? palaces.find((p) => p.gate === zhiShi)?.gong : undefined;

  markKongMa(palaces, ctx.hourKong, ctx.yiMa);

  // round：正数阳遁 / 负数阴遁
  const round = Number(t.round) || 0;
  return {
    engineId: 'taobi',
    school: '时家转盘',
    method,
    layer: '时家',
    meta: {
      siZhu: ctx.siZhu,
      jieQi: ctx.jieQi,
      dun: round >= 0 ? '阳遁' : '阴遁',
      ju: Math.abs(round),
      xunShou: ctx.xunShou,
      fuShou: ctx.fuShou,
      zhiFu,
      zhiShi,
      zhiFuGong: zhiFuPalace?.gong,
      zhiShiGong,
      kongWang: ctx.hourKong,
      maXing: ctx.yiMa,
      solarText: ctx.solarText,
      lunarText: ctx.lunarText,
    },
    palaces,
    raw: canvas,
  };
}

export const taobiEngine: QimenEngine = {
  id: 'taobi',
  name: '道盘 Taobi',
  school: '时家转盘',
  methods: ['拆补', '茅山', '均分'],
  layers: ['时家'],
  pkg: 'taobi',
  license: 'MPL-2.0',
  homepage: 'https://github.com/Taogram/taobi',
  notes: 'VSOP87D 天文级节气（精确到分钟），独有原创「均分法」定局',
  capabilities: ['马星', '空亡'],
  compute,
};
