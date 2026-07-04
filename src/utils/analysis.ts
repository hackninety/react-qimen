/**
 * 断局指引：从统一盘面提取引擎无关的用盘要点（吉凶门方位、值符方位、标记与格局统计）。
 * 仅作提纲挈领的指引，完整断验请结合格局面板与 AI 分析。
 */
import type { GongIndex, UnifiedQimenChart } from '@/engines/types';
import { GONG_DIRECTIONS } from '@/engines/types';
import { gateJiXiong } from '@/lib/reference';

export interface GongHint {
  gong: GongIndex;
  direction: string;
  gate?: string;
  star?: string;
  god?: string;
}

export interface ChartGuidance {
  /** 三吉门（开/休/生）落宫 */
  luckyGates: GongHint[];
  /** 三凶门（死/惊/伤）落宫 */
  uncertainGates: GongHint[];
  /** 值符方位提示 */
  zhiFuHint?: GongHint;
  /** 马星/空亡等标记与格局统计提示 */
  notes: string[];
  jiPatternCount: number;
  xiongPatternCount: number;
}

const hint = (chart: UnifiedQimenChart, gong: GongIndex): GongHint => {
  const p = chart.palaces[gong - 1];
  return { gong, direction: GONG_DIRECTIONS[gong], gate: p.gate, star: p.star, god: p.god };
};

export function buildGuidance(chart: UnifiedQimenChart): ChartGuidance {
  const luckyGates: GongHint[] = [];
  const uncertainGates: GongHint[] = [];

  for (const p of chart.palaces) {
    if (p.gong === 5 && chart.school !== '飞盘鸣法') continue;
    const jx = gateJiXiong(p.gate);
    if (jx === 'ji') luckyGates.push(hint(chart, p.gong));
    if (jx === 'xiong') uncertainGates.push(hint(chart, p.gong));
  }

  const zhiFuHint = chart.meta.zhiFuGong ? hint(chart, chart.meta.zhiFuGong) : undefined;

  const notes: string[] = [];
  if (zhiFuHint) {
    notes.push(`值符（${chart.meta.zhiFu ?? ''}）落 ${zhiFuHint.gong} 宫（${zhiFuHint.direction}），为诸神之首，所临之方百恶消散，利见贵谋事。`);
  }
  if (chart.meta.zhiShiGong) {
    notes.push(`值使（${chart.meta.zhiShi ?? ''}）落 ${chart.meta.zhiShiGong} 宫（${GONG_DIRECTIONS[chart.meta.zhiShiGong]}），号令之门，主事态发展的通道。`);
  }

  const maGongs = chart.palaces.filter((p) => p.marks.includes('马星')).map((p) => p.gong);
  if (maGongs.length) {
    notes.push(`马星落 ${maGongs.join('、')} 宫（${maGongs.map((g) => GONG_DIRECTIONS[g]).join('、')}），主变动奔驰，利出行迁移，谋事应速。`);
  }
  const kongGongs = chart.palaces.filter((p) => p.marks.includes('空亡')).map((p) => p.gong);
  if (kongGongs.length) {
    notes.push(`空亡在 ${kongGongs.join('、')} 宫（${kongGongs.map((g) => GONG_DIRECTIONS[g]).join('、')}），落空之事虚而不实，宜缓不宜急。`);
  }
  const jiXingGongs = chart.palaces.filter((p) => p.marks.includes('击刑')).map((p) => p.gong);
  if (jiXingGongs.length) {
    notes.push(`六仪击刑在 ${jiXingGongs.join('、')} 宫，事多刑伤阻滞，慎动。`);
  }
  const menPoGongs = chart.palaces.filter((p) => p.marks.includes('门迫')).map((p) => p.gong);
  if (menPoGongs.length) {
    notes.push(`门迫在 ${menPoGongs.join('、')} 宫，门克宫则事急而不顺，吉门迫则吉减，凶门迫则凶增。`);
  }
  const ruMuGongs = chart.palaces.filter((p) => p.marks.includes('入墓')).map((p) => p.gong);
  if (ruMuGongs.length) {
    notes.push(`入墓在 ${ruMuGongs.join('、')} 宫，干支入墓则昏晦无力，谋为难显。`);
  }

  const jiPatternCount = chart.patterns?.filter((p) => p.kind === '吉').length ?? 0;
  const xiongPatternCount = chart.patterns?.filter((p) => p.kind === '凶').length ?? 0;

  return { luckyGates, uncertainGates, zhiFuHint, notes, jiPatternCount, xiongPatternCount };
}
