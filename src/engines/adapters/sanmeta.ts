/**
 * 3meta 适配器 —— 时家转盘 · 拆补法
 * https://github.com/3metaJun/3meta （MIT）
 * 断盘要素最全：格局/旺衰/击刑/门迫/入墓/暗干/十干克应
 */
import { QimenChart } from '3meta';
import type {
  ComputeInput,
  GongIndex,
  PalaceInfo,
  PalaceMark,
  PatternHit,
  QimenEngine,
  UnifiedQimenChart,
} from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

function toArray(v: unknown): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map(String).filter((s) => s && s !== '无');
}

interface RawPattern {
  name?: string;
  type?: string;
  position?: number;
  description?: string;
}

function mapPatterns(list: RawPattern[] | undefined, kind: PatternHit['kind']): PatternHit[] {
  return (list ?? []).map((p) => ({
    name: p.name && p.type && p.type !== p.name ? `${p.name}·${p.type}` : (p.name ?? p.type ?? '格局'),
    gong: (p.position as GongIndex | undefined) ?? undefined,
    kind,
    note: p.description,
  }));
}

function compute({ date }: ComputeInput): UnifiedQimenChart {
  const text = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  const chart = QimenChart.byDatetime(text);

  const hidden: Map<number, string> =
    chart.hiddenStems instanceof Map
      ? (chart.hiddenStems as Map<number, string>)
      : new Map(Object.entries(chart.hiddenStems ?? {}).map(([k, v]) => [Number(k), String(v)]));

  const palaces: PalaceInfo[] = [...chart.palaces]
    .sort((a, b) => a.position - b.position)
    .map((p) => {
      const marks: PalaceMark[] = [];
      if (p.voidness?.hasVoidness) marks.push('空亡');
      if (p.isPostHorse) marks.push('马星');
      if (p.liuYiJiXing?.hasJiXing) marks.push('击刑');
      // GatePressure: '迫'(门克宫，凶) | '制'(宫克门) | '和' | '义' | '无'
      const gp = p.gatePressure;
      if (gp === '迫') marks.push('门迫');
      if ((p.tombInfo?.heavenlyStemInTomb?.length ?? 0) > 0 || (p.tombInfo?.earthlyStemInTomb?.length ?? 0) > 0)
        marks.push('入墓');

      const extras: Record<string, string> = {};
      if (p.status?.star && p.status.star !== '无') extras['星'] = p.status.star;
      if (p.status?.gate && p.status.gate !== '无') extras['门'] = p.status.gate;
      if (gp && gp !== '无' && gp !== '迫') extras['门宫'] = `门${gp}`;

      return {
        gong: p.position as GongIndex,
        diPanGan: toArray(p.earthlyStem),
        tianPanGan: toArray(p.heavenlyStem),
        star: toArray(p.star).join('/') || undefined,
        gate: p.gate === '无门' ? undefined : p.gate,
        god: p.deity === '无神' ? undefined : p.deity,
        hiddenGan: hidden.get(p.position),
        marks,
        extras: Object.keys(extras).length ? extras : undefined,
      };
    });

  // 上游 postHorse.position 为字符串（'2'），其 isPostHorse 与数字宫位严格比较恒 false，
  // 马星标记在宫位上丢失——按落宫号兜底补标
  const maGong = Number(chart.postHorse?.position);
  if (maGong >= 1 && maGong <= 9 && !palaces[maGong - 1].marks.includes('马星')) {
    palaces[maGong - 1].marks.push('马星');
  }

  const sp = chart.specialPatterns ?? {};
  const patterns: PatternHit[] = [
    ...mapPatterns(sp.auspiciousPatterns, '吉'),
    ...mapPatterns(sp.inauspiciousPatterns, '凶'),
  ];

  const fp = chart.fourPillars;
  const ti = chart.timeInfo;
  return {
    engineId: 'sanmeta',
    school: '时家转盘',
    method: '拆补',
    layer: '时家',
    meta: {
      siZhu: {
        year: fp.year.stem + fp.year.branch,
        month: fp.month.stem + fp.month.branch,
        day: fp.day.stem + fp.day.branch,
        hour: fp.hour.stem + fp.hour.branch,
      },
      jieQi: ti.solarTerm ?? '',
      yuan: chart.yuan as '上元' | '中元' | '下元',
      dun: chart.ju.type,
      ju: chart.ju.number,
      xunShou: ti.xunShou,
      zhiFu: chart.zhiFu?.star,
      zhiShi: chart.zhiShi?.gate,
      zhiFuGong: chart.zhiFu?.position as GongIndex | undefined,
      zhiShiGong: chart.zhiShi?.position as GongIndex | undefined,
      kongWang: ti.voidness,
      maXing: chart.postHorse?.branch,
      solarText: ti.solarDate,
      lunarText: ti.lunarDate,
    },
    palaces,
    patterns,
    raw: chart,
  };
}

export const sanmetaEngine: QimenEngine = {
  id: 'sanmeta',
  name: '三元 3meta',
  school: '时家转盘',
  methods: ['拆补'],
  layers: ['时家'],
  pkg: '3meta',
  license: 'MIT',
  homepage: 'https://github.com/3metaJun/3meta',
  notes: '社区最活跃的 TS 排盘库，格局/旺衰/击刑/门迫/入墓/暗干最全，i18n 支持',
  capabilities: ['格局', '暗干', '击刑', '门迫', '入墓', '旺衰', '马星', '空亡'],
  compute,
};
