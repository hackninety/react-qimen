/**
 * qimendunjia-standalone 适配器 —— 时家转盘 · 拆补法
 * https://github.com/MrJelly/QiMenDunJia （MIT）
 * 历法适配层架构（寿星天文历移植），交节边界精度高，另有 lite/tyme4ts 变体
 */
import { calculate } from 'qimendunjia-standalone';
import { markKongMa } from '../calendar';
import type {
  ChartLayer,
  ComputeInput,
  GongIndex,
  PalaceInfo,
  QimenEngine,
  UnifiedQimenChart,
} from '../types';

/** '禽芮' 之类的缩写星名 → '天禽/天芮' */
function normalizeStar(v: string): string | undefined {
  if (!v) return undefined;
  if (v.includes('天')) return v;
  return v.split('').map((c) => `天${c}`).join('/');
}

function compute({ date, layer }: ComputeInput): UnifiedQimenChart {
  const L: ChartLayer = layer ?? '时家';
  const r = calculate(date, { method: L });
  if ('error' in r) throw new Error(`qimendunjia-standalone 排盘失败：${r.message}`);

  const raw = r.raw;
  const palaces: PalaceInfo[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as GongIndex[]).map((g) => {
    const k = String(g) as keyof typeof raw.diPan;
    return {
      gong: g,
      diPanGan: (raw.diPan[k] ?? '').split('\n').filter(Boolean),
      tianPanGan: (raw.tianPan[k] ?? '').split('\n').filter(Boolean),
      star: normalizeStar(raw.jiuXing[k] ?? ''),
      gate: raw.baMen[k] || undefined,
      god: raw.baShen[k] || undefined,
      hiddenGan: raw.anGan[k] || undefined,
      marks: [],
    };
  });

  const kongWang = (r.info.kong ?? '').split('');
  const zhiFu = r.info.fu.replace(/^值符[:：]/, '');
  const zhiShi = r.info.shi.replace(/^值使[:：]/, '');
  const zhiFuGong = palaces.find((p) => p.god === '值符')?.gong;
  const zhiShiGong = palaces.find((p) => p.gate === zhiShi)?.gong;

  // 马星按时支三合（库本身不直出马星地支）
  const hourZhi = r.info.siZhu.time[1];
  const maMap: Record<string, string> = {
    申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申',
    巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳',
  };
  const maXing = maMap[hourZhi] ?? '';
  markKongMa(palaces, kongWang, maXing);

  const xs = r.info.xunshou ?? '';
  return {
    engineId: 'jelly',
    school: '时家转盘',
    method: '拆补',
    layer: L,
    meta: {
      siZhu: {
        year: r.info.siZhu.year,
        month: r.info.siZhu.month,
        day: r.info.siZhu.day,
        hour: r.info.siZhu.time,
      },
      jieQi: raw.juShu.jieQiName,
      yuan: raw.juShu.yuan,
      dun: raw.juShu.type === 'yang' ? '阳遁' : '阴遁',
      ju: raw.juShu.number,
      xunShou: xs.slice(0, 2),
      fuShou: xs.slice(2) || raw.xunShou,
      zhiFu,
      zhiShi,
      zhiFuGong,
      zhiShiGong,
      kongWang,
      maXing,
      solarText: r.info.date,
      lunarText: r.info.lunar,
    },
    palaces,
    raw: r,
  };
}

export const jellyEngine: QimenEngine = {
  id: 'jelly',
  name: '鲸落 QMDJ Standalone',
  school: '时家转盘',
  methods: ['拆补'],
  layers: ['时家', '日家', '月家', '年家'],
  pkg: 'qimendunjia-standalone',
  license: 'MIT',
  homepage: 'https://github.com/MrJelly/QiMenDunJia',
  notes: '历法适配层架构（寿星天文历），交节边界精度高，支持年月日时四层盘与晚子时模式',
  capabilities: ['暗干', '马星', '空亡'],
  compute,
};
