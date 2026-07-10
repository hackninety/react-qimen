/**
 * 用神定位引擎：按占类规则在盘面上找到各用神落宫，并评估其状态
 * （旺衰、宫与用神生克、空亡入墓等标记、同宫组合、与日干宫关系）。
 * 断盘第一步"定用神"由此完成，结果进 UI、导出与 AI Prompt。
 */
import type { GongIndex, UnifiedQimenChart, PalaceInfo } from '@/engines/types';
import { GONG_DIRECTIONS } from '@/engines/types';
import { PALACE_BRANCHES, XUN_TO_FUSHOU, xunShouOf } from '@/engines/calendar';
import { ganWx, gateWx, GONG_WX, relationOf, starWx, type WuXing } from '@/lib/wuxing-logic';
import { COMMON_YONGSHEN, getTopic, type TopicDef, type YongShenRule } from '@/lib/yongshen-rules';

export interface YongShenEntry {
  role: string;
  /** 实际符号（甲遁仪时如「甲(遁戊)」；值使解析为具体门名） */
  symbol: string;
  gong?: GongIndex;
  direction?: string;
  /** 同宫组合：神·星·门｜天盘/地盘 */
  cohabit?: string;
  /** 宫位标记（空亡/入墓/击刑/门迫/马星） */
  marks?: string[];
  /** 旺衰（引擎提供星/门旺衰时） */
  wangShuai?: string;
  /** 宫与用神五行关系（得宫生/受宫克/比和/泄于宫/克制其宫） */
  gongRelation?: string;
  /** 用神宫与日干宫的宫际生克（非日干用神时给出） */
  vsDayGong?: string;
  /** 盘面未见该要素（引擎能力限制） */
  missing?: boolean;
}

export interface YongShenReport {
  topicId: string;
  topicLabel: string;
  note?: string;
  entries: YongShenEntry[];
}

/** 甲不上盘：日干甲用日旬遁仪，时干甲用时旬符首 */
function resolveGan(gan: string, pillarGz: string): { gan: string; display: string } {
  if (gan !== '甲') return { gan, display: gan };
  const dun = XUN_TO_FUSHOU[xunShouOf(pillarGz)] ?? '';
  return { gan: dun, display: dun ? `甲(遁${dun})` : '甲' };
}

function findByGan(chart: UnifiedQimenChart, gan: string): PalaceInfo[] {
  // 寄宫可能使同一干见于中五与坤二，优先非中五
  const hits = chart.palaces.filter((p) => p.tianPanGan.includes(gan));
  return hits.length > 1 ? hits.filter((p) => p.gong !== 5) : hits;
}

const starTokens = (star?: string) => (star ?? '').replace(/[天/]/g, '').split('');

function symbolWx(rule: YongShenRule, symbol: string): WuXing | undefined {
  switch (rule.kind) {
    case 'dayGan':
    case 'hourGan':
    case 'gan':
      return ganWx(symbol);
    case 'gate':
      return gateWx(symbol);
    case 'star':
      return starWx(symbol);
    default:
      return undefined; // 神/马星不论五行
  }
}

const GONG_REL_TEXT: Record<ReturnType<typeof relationOf>, string> = {
  被生: '得宫生（旺）',
  比和: '与宫比和（相）',
  克: '克制其宫（乘势）',
  被克: '受宫克（囚制）',
  生: '生宫泄气（耗）',
};

function evaluate(
  rule: YongShenRule,
  symbol: string,
  display: string,
  palaces: PalaceInfo[],
  dayGong?: GongIndex,
): YongShenEntry {
  if (!palaces.length) {
    return { role: rule.role, symbol: display, missing: true };
  }
  const p = palaces[0]; // 多宫命中取主宫（非中五优先已在 findByGan 处理）
  const wx = symbolWx(rule, symbol);
  const gongWx = GONG_WX[p.gong];

  const wangShuai =
    rule.kind === 'gate' ? p.extras?.['门'] : rule.kind === 'star' ? p.extras?.['星'] : undefined;

  const entry: YongShenEntry = {
    role: rule.role,
    symbol: display,
    gong: p.gong,
    direction: GONG_DIRECTIONS[p.gong],
    cohabit: `${p.god ?? '—'}·${p.star ?? '—'}·${p.gate ?? '—'}｜天盘${p.tianPanGan.join('') || '—'} 地盘${p.diPanGan.join('') || '—'}`,
    marks: p.marks.length ? [...p.marks] : undefined,
    wangShuai,
    gongRelation: wx && gongWx ? GONG_REL_TEXT[relationOf(wx, gongWx)] : undefined,
  };
  if (dayGong && p.gong !== dayGong) {
    const rel = relationOf(GONG_WX[p.gong], GONG_WX[dayGong]);
    const text: Record<typeof rel, string> = {
      生: '其宫生日干宫（来就我，事顺）',
      克: '其宫克日干宫（来克我，多阻）',
      被生: '日干宫生其宫（我去求之，费力）',
      被克: '日干宫克其宫（我可制之）',
      比和: '与日干宫比和（同气）',
    };
    entry.vsDayGong = text[rel];
  } else if (dayGong && p.gong === dayGong) {
    entry.vsDayGong = '与日干同宫（事身相随）';
  }
  return entry;
}

export function locateYongShen(chart: UnifiedQimenChart, topicId: string): YongShenReport {
  const topic: TopicDef = getTopic(topicId);
  const m = chart.meta;
  const entries: YongShenEntry[] = [];

  // 通用用神先定日干宫（后续用神与之论宫际生克）
  const day = resolveGan(m.siZhu.day?.[0] ?? '', m.siZhu.day ?? '');
  const dayPalaces = day.gan ? findByGan(chart, day.gan) : [];
  const dayGong = dayPalaces[0]?.gong;

  for (const rule of [...COMMON_YONGSHEN, ...topic.yongShen]) {
    switch (rule.kind) {
      case 'dayGan': {
        entries.push(evaluate(rule, day.gan, day.display, dayPalaces));
        break;
      }
      case 'hourGan': {
        // 时家以外盘类无时柱：退用该盘类主柱之干（日家=日干与通用重合，略）
        const pillar = m.siZhu.hour || (chart.layer === '月家' ? m.siZhu.month : chart.layer === '年家' ? m.siZhu.year : '');
        if (!pillar) break;
        const hour = resolveGan(pillar[0], pillar);
        entries.push(evaluate(rule, hour.gan, hour.display, hour.gan ? findByGan(chart, hour.gan) : [], dayGong));
        break;
      }
      case 'gan': {
        entries.push(evaluate(rule, rule.symbol!, rule.symbol!, findByGan(chart, rule.symbol!), dayGong));
        break;
      }
      case 'gate': {
        const gate = rule.symbol === '值使' ? m.zhiShi : rule.symbol;
        if (!gate) {
          entries.push({ role: rule.role, symbol: rule.symbol ?? '值使', missing: true });
          break;
        }
        entries.push(evaluate(rule, gate, gate, chart.palaces.filter((p) => p.gate === gate), dayGong));
        break;
      }
      case 'star': {
        const core = rule.symbol!.replace('天', '');
        entries.push(
          evaluate(rule, rule.symbol!, rule.symbol!, chart.palaces.filter((p) => starTokens(p.star).includes(core)), dayGong),
        );
        break;
      }
      case 'god': {
        entries.push(
          evaluate(rule, rule.symbol!, rule.symbol!, chart.palaces.filter((p) => p.god === rule.symbol), dayGong),
        );
        break;
      }
      case 'ma': {
        let maPalaces = chart.palaces.filter((p) => p.marks.includes('马星'));
        // 引擎未标马星时按马星地支辖宫兜底
        if (!maPalaces.length && m.maXing) {
          maPalaces = chart.palaces.filter((p) => PALACE_BRANCHES[p.gong]?.includes(m.maXing!));
        }
        entries.push(evaluate(rule, '马星', `马星(${m.maXing || '—'})`, maPalaces, dayGong));
        break;
      }
    }
  }

  return { topicId: topic.id, topicLabel: topic.label, note: topic.note, entries };
}
