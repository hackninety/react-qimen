/**
 * 多引擎一致性校验：同一时刻静默用参照引擎复排，对比核心盘面要素。
 * 一致 → 导出携带「双引擎校验一致 ✓」增信；不一致 → 列出差异供人工/AI 甄别。
 *
 * 参照引擎选择（同定局法才有互证意义）：
 * - 时家拆补：sanmeta ↔ bigfish（jelly/kinqimen 亦对照 sanmeta）
 * - 时家茅山：taobi ↔ bigfish
 * - 置闰/均分/鸣法：仅单引擎支持，无参照
 * - 年/月/日家：bigfish 与 jelly 定局法分属不同流派（见 docs/SCHOOLS.md），不做互证
 */
import { getQimenEngine } from '@/engines/registry';
import { GONG_TRIGRAMS } from '@/engines/types';
import type { ComputeInput, GongIndex, QimenEngineId, UnifiedQimenChart } from '@/engines/types';

export interface CrossCheckResult {
  referenceId: QimenEngineId;
  referenceName: string;
  /** 对比范围说明 */
  scope: string;
  consistent: boolean;
  diffs: string[];
}

export interface ChartDiff {
  consistent: boolean;
  diffs: string[];
  /** 存在差异的宫（供对照视图高亮） */
  gongs: Set<GongIndex>;
}

const SCOPE = '阴阳遁与局数、值符值使、九宫天盘干/八门/九星/八神';

function pickReference(chart: UnifiedQimenChart): QimenEngineId | null {
  if (chart.layer !== '时家') return null;
  if (chart.method === '拆补') return chart.engineId === 'sanmeta' ? 'bigfish' : 'sanmeta';
  if (chart.method === '茅山') return chart.engineId === 'taobi' ? 'bigfish' : 'taobi';
  return null;
}

/** 星名 → 单字 token 集（去「天」、拆「芮/禽」并写，禽归芮：中五寄宫两星本同席） */
function starTokens(s?: string): Set<string> {
  return new Set(
    (s ?? '')
      .replace(/天/g, '')
      .split('/')
      .map((t) => (t === '禽' ? '芮' : t))
      .filter(Boolean),
  );
}

/** 八神别名归一（转盘阴阳二盘异名同神：勾陈=白虎、朱雀=玄武；螣蛇为腾蛇异体） */
const GOD_ALIAS: Record<string, string> = { 勾陈: '白虎', 朱雀: '玄武', 螣蛇: '腾蛇' };
const god = (g?: string) => (g ? (GOD_ALIAS[g] ?? g) : '');

const intersects = (a: Set<string>, b: Set<string>) => [...a].some((v) => b.has(v));
const subset = (a: Set<string>, b: Set<string>) => [...a].every((v) => b.has(v));

/**
 * 两盘核心要素对比（对照视图与交叉校验共用）。
 * 天盘干按集合子集容差（寄宫并写差异不算不一致），星按 token 交集容差，
 * 八神按别名/异体归一后比较；差异宫号收入 gongs 供高亮。
 */
export function diffCharts(chart: UnifiedQimenChart, ref: UnifiedQimenChart): ChartDiff {
  const diffs: string[] = [];
  const gongs = new Set<GongIndex>();
  const a = chart.meta;
  const b = ref.meta;
  if (a.dun !== b.dun || a.ju !== b.ju) diffs.push(`局：${a.dun}${a.ju}局 vs ${b.dun}${b.ju}局`);
  if (a.zhiFu && b.zhiFu && !intersects(starTokens(a.zhiFu), starTokens(b.zhiFu))) {
    diffs.push(`值符：${a.zhiFu} vs ${b.zhiFu}`);
  }
  if (a.zhiShi && b.zhiShi && a.zhiShi !== b.zhiShi) diffs.push(`值使：${a.zhiShi} vs ${b.zhiShi}`);

  for (let i = 0; i < 9; i++) {
    const pa = chart.palaces[i];
    const pb = ref.palaces[i];
    if (!pa || !pb) continue;
    const gongName = `${GONG_TRIGRAMS[pa.gong]}${pa.gong}宫`;
    const mark = (text: string) => {
      diffs.push(text);
      gongs.add(pa.gong);
    };

    const ta = new Set(pa.tianPanGan);
    const tb = new Set(pb.tianPanGan);
    if (!(subset(ta, tb) || subset(tb, ta))) {
      mark(`${gongName}天盘干：${pa.tianPanGan.join('') || '—'} vs ${pb.tianPanGan.join('') || '—'}`);
    }
    if (pa.gate && pb.gate && pa.gate !== pb.gate) mark(`${gongName}八门：${pa.gate} vs ${pb.gate}`);
    const sa = starTokens(pa.star);
    const sb = starTokens(pb.star);
    if (sa.size && sb.size && !intersects(sa, sb)) mark(`${gongName}九星：${pa.star} vs ${pb.star}`);
    if (pa.god && pb.god && god(pa.god) !== god(pb.god)) mark(`${gongName}八神：${pa.god} vs ${pb.god}`);
  }

  return { consistent: diffs.length === 0, diffs, gongs };
}

/**
 * 与参照引擎交叉校验；无参照或参照排盘失败返回 null。
 */
export function crossCheckChart(chart: UnifiedQimenChart, input: ComputeInput): CrossCheckResult | null {
  const refId = pickReference(chart);
  if (!refId) return null;
  const refEngine = getQimenEngine(refId);
  let ref: UnifiedQimenChart;
  try {
    ref = refEngine.compute({ ...input, layer: '时家' });
  } catch {
    return null;
  }

  const { consistent, diffs } = diffCharts(chart, ref);
  return {
    referenceId: refId,
    referenceName: refEngine.name,
    scope: SCOPE,
    consistent,
    diffs,
  };
}
