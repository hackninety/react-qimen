/**
 * bigfishmarquis-qimen 适配器 —— 时家转盘 · 拆补/茅山/置闰
 * https://github.com/perfhelf/bigfishmarquis-qimen （MIT）
 * 唯一同时提供三种定局法的 JS 库，零运行时依赖；历法上下文由本项目 calendar.ts 提供
 */
import { shiJiaGenerate } from 'bigfishmarquis-qimen/src/engines/shijia';
import { chaiBuJuByGanZhi } from 'bigfishmarquis-qimen/src/engines/chaibuquju';
import { maoShanJu } from 'bigfishmarquis-qimen/src/engines/maoshan';
import { zhiRunJu } from 'bigfishmarquis-qimen/src/engines/zhirun';
import { getCalendarContext } from '../calendar';
import type {
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

function compute({ date, method }: ComputeInput): UnifiedQimenChart {
  const ctx = getCalendarContext(date);
  const ju = resolveJu(method, ctx);

  const fourPillars = {
    year: { gan: ctx.siZhu.year[0], zhi: ctx.siZhu.year[1] },
    month: { gan: ctx.siZhu.month[0], zhi: ctx.siZhu.month[1] },
    day: { gan: ctx.siZhu.day[0], zhi: ctx.siZhu.day[1] },
    hour: { gan: ctx.hourGan, zhi: ctx.hourZhi },
  };
  const chart = shiJiaGenerate(
    ctx.hourGan,
    ctx.hourZhi,
    ju.juNumber,
    ju.isYangDun ? 'yang' : 'yin',
    fourPillars,
    ctx.jieQi,
  );

  const palaces: PalaceInfo[] = [...chart.palaces]
    .sort((a, b) => a.palaceNumber - b.palaceNumber)
    .map((p) => {
      const marks = [...new Set([...(p.marks ?? []), ...(p.jiMarks ?? [])].map((m) => MARK_MAP[m]).filter(Boolean))];
      const extras: Record<string, string> = {};
      if (p.diGod) extras['地神'] = p.diGod;
      return {
        gong: p.palaceNumber as GongIndex,
        diPanGan: [p.earthStem].filter(Boolean),
        tianPanGan: [p.skyStem, p.jiGanStem].filter((s): s is string => Boolean(s)),
        star: p.star || undefined,
        gate: p.door || undefined,
        god: p.god || undefined,
        hiddenGan: p.hiddenStems?.join('') || undefined,
        marks,
        extras: Object.keys(extras).length ? extras : undefined,
      };
    });

  return {
    engineId: 'bigfish',
    school: '时家转盘',
    method,
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
    palaces,
    raw: chart,
  };
}

export const bigfishEngine: QimenEngine = {
  id: 'bigfish',
  name: '鲲侯 BigFishMarquis',
  school: '时家转盘',
  methods: ['拆补', '茅山', '置闰'],
  pkg: 'bigfishmarquis-qimen',
  license: 'MIT',
  homepage: 'https://github.com/perfhelf/bigfishmarquis-qimen',
  notes: '唯一支持拆补/茅山/置闰三种定局法的 JS 引擎，零依赖，含地八神/暗干/墓刑迫标记',
  capabilities: ['暗干', '击刑', '门迫', '入墓', '马星', '空亡'],
  compute,
};
