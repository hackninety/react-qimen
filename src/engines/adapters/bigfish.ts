/**
 * bigfishmarquis-qimen 适配器 —— 时家（拆补/茅山/置闰）+ 年/月/日家四层盘
 * https://github.com/perfhelf/bigfishmarquis-qimen （MIT）
 * 唯一同时提供三种定局法 + 四层盘的 JS 库，零运行时依赖；时家历法上下文由 calendar.ts 提供
 */
import { shiJiaGenerate } from 'bigfishmarquis-qimen/src/engines/shijia';
import { chaiBuJuByGanZhi } from 'bigfishmarquis-qimen/src/engines/chaibuquju';
import { maoShanJu } from 'bigfishmarquis-qimen/src/engines/maoshan';
import { zhiRunJu } from 'bigfishmarquis-qimen/src/engines/zhirun';
import { nianJiaGenerate, yueJiaGenerate, riJiaGenerate, type QimenChart } from 'bigfishmarquis-qimen';
import { getCalendarContext, markKongMa, XUN_TO_FUSHOU, xunShouOf, yiMaOf } from '../calendar';
import { DI_ZHI, TIAN_GAN } from '../types';
import type {
  ChartLayer,
  ComputeInput,
  GongIndex,
  JuMethod,
  PalaceInfo,
  PalaceMark,
  QimenEngine,
  UnifiedQimenChart,
} from '../types';

/** bigfish 的宫位标记 → 统一标记 */
const MARK_MAP: Record<string, PalaceMark> = {
  空: '空亡', 时空: '空亡', 马: '马星', 刑: '击刑', 墓: '入墓', 迫: '门迫',
};

/**
 * bigfish QimenChart.palaces → 统一宫位（时家/年月日家共用同一结构）。
 * ⚠️ 上游字段名历史遗留互换（其 types.ts 自注）：earthStem 字段存的是天盘干、
 * skyStem 字段存的是地盘干；jiGanStem 为天禽寄干，属天盘侧。
 * 曾按字面取值导致天地盘互换（双引擎校验发现），此处按真实语义映射。
 */
function mapPalaces(chart: QimenChart): PalaceInfo[] {
  return [...chart.palaces]
    .sort((a, b) => a.palaceNumber - b.palaceNumber)
    .map((p) => {
      const marks = [...new Set([...(p.marks ?? []), ...(p.jiMarks ?? [])].map((m) => MARK_MAP[m]).filter(Boolean))];
      const extras: Record<string, string> = {};
      if (p.diGod) extras['地神'] = p.diGod;
      return {
        gong: p.palaceNumber as GongIndex,
        diPanGan: [p.skyStem].filter(Boolean),
        tianPanGan: [p.earthStem, p.jiGanStem].filter((s): s is string => Boolean(s)),
        star: p.star || undefined,
        gate: p.door || undefined,
        god: p.god || undefined,
        hiddenGan: p.hiddenStems?.join('') || undefined,
        marks,
        extras: Object.keys(extras).length ? extras : undefined,
      };
    });
}

function resolveJu(method: JuMethod, ctx: ReturnType<typeof getCalendarContext>) {
  switch (method) {
    case '茅山':
      return maoShanJu(ctx.jieQi, ctx.elapsedHours);
    case '置闰':
      return zhiRunJu(ctx.jieQi, ctx.dayGzIndex, ctx.daysSinceJieQi);
    case '拆补':
    default:
      return chaiBuJuByGanZhi(ctx.jieQi, ctx.siZhu.day[0], ctx.siZhu.day[1], undefined);
  }
}

/** 时家转盘（拆补/茅山/置闰） */
function computeShiJia(date: Date, method: JuMethod): UnifiedQimenChart {
  const ctx = getCalendarContext(date);
  const ju = resolveJu(method, ctx);
  const fourPillars = {
    year: { gan: ctx.siZhu.year[0], zhi: ctx.siZhu.year[1] },
    month: { gan: ctx.siZhu.month[0], zhi: ctx.siZhu.month[1] },
    day: { gan: ctx.siZhu.day[0], zhi: ctx.siZhu.day[1] },
    hour: { gan: ctx.hourGan, zhi: ctx.hourZhi },
  };
  const chart = shiJiaGenerate(ctx.hourGan, ctx.hourZhi, ju.juNumber, ju.isYangDun ? 'yang' : 'yin', fourPillars, ctx.jieQi);

  return {
    engineId: 'bigfish',
    school: '时家转盘',
    method,
    layer: '时家',
    meta: {
      siZhu: ctx.siZhu,
      jieQi: ctx.jieQi,
      yuan: `${ju.yuan}元` as '上元' | '中元' | '下元',
      dun: ju.isYangDun ? '阳遁' : '阴遁',
      ju: ju.juNumber,
      xunShou: ctx.xunShou,
      fuShou: ctx.fuShou,
      zhiFu: chart.zhiFuStar,
      zhiShi: chart.zhiShiDoor,
      zhiFuGong: chart.zhiFuPalace as GongIndex,
      zhiShiGong: chart.zhiShiPalace as GongIndex,
      kongWang: chart.kongWang,
      maXing: ctx.yiMa,
      solarText: ctx.solarText,
      lunarText: ctx.lunarText,
    },
    palaces: mapPalaces(chart),
    raw: chart,
  };
}

/** 公历年号 → 该年大部分时段的干支（1984=甲子），用于探测立春前后 */
function civilYearGz(year: number): string {
  const idx = (((year - 1984) % 60) + 60) % 60;
  return TIAN_GAN[idx % 10] + DI_ZHI[idx % 12];
}

/** 年/月/日家（按太岁年 / 节气月 / 公历日定局，无定局法之分） */
function computeLayer(layer: '日家' | '月家' | '年家', date: Date): UnifiedQimenChart {
  const ctx = getCalendarContext(date);
  // bigfish 年/月家生成器按公历年号取太岁：立春之前（如 2025-01）年号对应的干支
  // 尚未换岁，直接传会误用次年太岁；以 lunar-typescript 精确年柱校准年号
  const taiSuiYear = civilYearGz(date.getFullYear()) === ctx.siZhu.year ? date.getFullYear() : date.getFullYear() - 1;
  const chart =
    layer === '年家'
      ? nianJiaGenerate(taiSuiYear)
      : layer === '月家'
        ? yueJiaGenerate(taiSuiYear, ctx.solarMonthOrdinal)
        : riJiaGenerate(date.getFullYear(), date.getMonth() + 1, date.getDate());

  // 四柱显示与用神/马星均用 lunar-typescript 精确值（bigfish 内部月柱在交节日按日粒度切换，
  // 曾致 1990-11-08 已交立冬仍显丙戌月）；时柱不参与年/月/日家定局，留空
  const siZhu = { ...ctx.siZhu, hour: '' };
  const pillarGz = layer === '年家' ? siZhu.year : layer === '月家' ? siZhu.month : siZhu.day;
  const maXing = pillarGz ? yiMaOf(pillarGz[1]) : '';
  const xunShou = pillarGz ? xunShouOf(pillarGz) : '';

  const palaces = mapPalaces(chart);
  markKongMa(palaces, chart.kongWang ?? [], maXing);

  return {
    engineId: 'bigfish',
    school: '时家转盘',
    method: '拆补', // 年月日家无定局法之分，占位
    layer,
    meta: {
      siZhu,
      jieQi: ctx.jieQi,
      yuan: `${chart.yuan}元` as '上元' | '中元' | '下元',
      dun: chart.dun === 'yang' ? '阳遁' : '阴遁',
      ju: chart.juNumber,
      xunShou,
      fuShou: XUN_TO_FUSHOU[xunShou] ?? '',
      zhiFu: chart.zhiFuStar,
      zhiShi: chart.zhiShiDoor,
      zhiFuGong: chart.zhiFuPalace as GongIndex,
      zhiShiGong: chart.zhiShiPalace as GongIndex,
      kongWang: chart.kongWang,
      maXing,
      solarText: ctx.solarText,
      lunarText: ctx.lunarText,
    },
    palaces,
    raw: chart,
  };
}

function compute({ date, method, layer }: ComputeInput): UnifiedQimenChart {
  const L: ChartLayer = layer ?? '时家';
  return L === '时家' ? computeShiJia(date, method) : computeLayer(L, date);
}

export const bigfishEngine: QimenEngine = {
  id: 'bigfish',
  name: '鲲侯 BigFishMarquis',
  school: '时家转盘',
  methods: ['拆补', '茅山', '置闰'],
  layers: ['时家', '日家', '月家', '年家'],
  pkg: 'bigfishmarquis-qimen',
  license: 'MIT',
  homepage: 'https://github.com/perfhelf/bigfishmarquis-qimen',
  notes: '唯一支持拆补/茅山/置闰三定局法 + 年月日时四层盘的 JS 引擎，零依赖，含地八神/暗干/墓刑迫标记',
  lateZi: '晚子时不换日：日柱属当日，时柱按次日子时干支（历法上下文 lunar-typescript）',
  capabilities: ['暗干', '击刑', '门迫', '入墓', '马星', '空亡'],
  compute,
};
