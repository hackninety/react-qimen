/**
 * 盘面导出：Markdown / JSON / TOON（完整盘面，供 AI 全面推理）。
 *
 * 除排盘口径与地理/时间上下文外，还携带断盘方法论素材：
 * 所占何事 + 用神定位状态 + 机器预计算生克 + 该占类古法原文 + 典籍参考。
 * TOON（Token-Oriented Object Notation）与 JSON 同源同构，均出自
 * buildExportPayload；TOON 对均匀数组按表格编码，喂 LLM 更省 token。
 */
import { encode as toonEncode } from '@toon-format/toon';
import type { QimenEngine, UnifiedQimenChart } from '@/engines/types';
import { GONG_TRIGRAMS, GONG_DIRECTIONS } from '@/engines/types';
import type { CanonRef } from '@/hooks/useCanonRefs';
import type { ZhanFa } from '@/hooks/useZhanFa';
import { getTopic } from '@/lib/yongshen-rules';
import { juBasisDetail, juBasisText } from './chart-basis';
import type { CrossCheckResult } from './cross-check';
import type { ChartRelations } from './relations';
import { relationsSummary } from './relations';
import type { SolarTimeResult } from './true-solar-time';
import { formatOffset } from './true-solar-time';
import type { YongShenReport } from './yongshen';

/** 导出附加素材（均可选，缺省仍导出纯盘面） */
export interface ExportExtra {
  /** 典籍参考（盘面克应检索命中） */
  refs?: CanonRef[] | null;
  /** 机器预计算生克关系 */
  relations?: ChartRelations | null;
  /** 所占何事（占类 id + 事由 + 求测人生年）与用神定位 */
  inquiry?: { topicId: string; subject?: string; birthYear?: number; yongshen: YongShenReport } | null;
  /** 该占类古法原文（分类论断 + 相关占目） */
  zhanfa?: ZhanFa | null;
  /** 参照引擎交叉校验（时家同定局法双引擎对比） */
  crossCheck?: CrossCheckResult | null;
}

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** 真太阳时上下文（两种导出共用） */
function solarContext(solar: SolarTimeResult) {
  if (!solar.applied) {
    return { 启用: false as const, 说明: '未启用真太阳时，按输入钟表时间（浏览器本地时区）排盘' };
  }
  return {
    启用: true as const,
    地点: solar.place,
    经度: solar.longitude,
    解释时区: solar.timezone || undefined,
    时区偏移分钟: solar.tzOffsetMinutes,
    经度修正分钟: solar.longitudeCorrectionMinutes,
    均时差分钟: solar.eotMinutes,
    总修正分钟: solar.offsetMinutes,
    输入钟表时间: fmt(solar.standardDate),
    真太阳时: fmt(solar.date),
    说明: '排盘采用真太阳时：输入时间 + 经度修正（经度×4分钟−时区偏移）+ 均时差（Spencer公式）',
  };
}

/** 结构化导出载荷（JSON 与 TOON 共用；不含引擎原始 raw 数据） */
function buildExportPayload(chart: UnifiedQimenChart, engine: QimenEngine, solar: SolarTimeResult, extra?: ExportExtra) {
  const { refs, relations, inquiry, zhanfa, crossCheck } = extra ?? {};
  const m = chart.meta;
  return {
    应用: 'react-qimen 奇门遁甲排盘',
    排盘口径: {
      盘类: chart.layer,
      流派: chart.layer === '时家' ? chart.school : undefined,
      定局法: chart.layer === '时家' ? `${chart.method}法` : undefined,
      引擎: { 名称: engine.name, npm包: engine.pkg, 许可证: engine.license, 仓库: engine.homepage },
      能力: engine.capabilities,
      晚子时口径: engine.lateZi,
      双引擎校验: crossCheck
        ? {
            参照引擎: crossCheck.referenceName,
            范围: crossCheck.scope,
            结论: crossCheck.consistent ? '一致 ✓' : `存在 ${crossCheck.diffs.length} 处差异（口径或上游实现差异，采信本盘为准）`,
            差异: crossCheck.diffs.length ? crossCheck.diffs : undefined,
          }
        : undefined,
      提示: '不同流派/定局法结果不可直接混用比对；本盘所有字段均按上述口径产生',
    },
    时间: {
      排盘时间: fmt(solar.date),
      农历: m.lunarText,
      四柱: m.siZhu,
      当日节气: m.jieQi,
    },
    真太阳时: solarContext(solar),
    局: {
      定局依据: juBasisDetail(chart),
      阴阳遁: m.dun,
      局数: m.ju,
      三元: m.yuan,
      旬首: m.xunShou,
      符首: m.fuShou,
      值符: m.zhiFu,
      值符落宫: m.zhiFuGong,
      值使: m.zhiShi,
      值使落宫: m.zhiShiGong,
      空亡: m.kongWang,
      马星: m.maXing,
    },
    九宫: chart.palaces.map((p) => ({
      宫: `${GONG_TRIGRAMS[p.gong]}${p.gong}宫`,
      方位: GONG_DIRECTIONS[p.gong],
      八神: p.god,
      九星: p.star,
      八门: p.gate,
      天盘干: p.tianPanGan,
      地盘干: p.diPanGan,
      暗干: p.hiddenGan,
      标记: p.marks.length ? p.marks : undefined,
      ...(p.extras ?? {}),
    })),
    所占何事: inquiry
      ? {
          占类: getTopic(inquiry.topicId).label,
          事由: inquiry.subject || undefined,
          求测人生年: inquiry.birthYear,
          口径: inquiry.yongshen.note,
        }
      : undefined,
    用神定位: inquiry
      ? inquiry.yongshen.entries.map((e) => ({
          用神: e.role,
          符号: e.symbol,
          落宫: e.missing ? '盘面未见' : `${e.gong}宫·${e.direction}`,
          同宫组合: e.cohabit,
          旺衰: e.wangShuai,
          宫与用神: e.gongRelation,
          与日干宫: e.vsDayGong,
          标记: e.marks,
          备注: e.note,
        }))
      : undefined,
    生克关系: relations
      ? {
          全局: relationsSummary(relations),
          九宫: relations.palaces.map((p) => ({
            宫: `${GONG_TRIGRAMS[p.gong]}${p.gong}宫`,
            天地盘干: p.ganGan,
            门与宫: p.menGong?.text,
            星与宫: p.xingGong,
          })),
        }
      : undefined,
    格局: chart.patterns?.map((pt) => ({
      名称: pt.name,
      落宫: pt.gong,
      吉凶: pt.kind,
      断语: pt.note,
    })),
    占法要旨: zhanfa && (zhanfa.lunDuan.length || zhanfa.zhanMu.length)
      ? {
          说明: `《奇門遁甲秘笈大全》${zhanfa.topicId}占古法（分类论断卷十一~十四；相关占目卷七~十）`,
          分类论断: zhanfa.lunDuan.map((e) => ({ 方面: e.aspect, 题: e.title, 原文: e.text, 出处: e.docPath })),
          相关占目: zhanfa.zhanMu.map((e) => ({ 题: e.title, 原文: e.text, 出处: e.docPath })),
        }
      : undefined,
    典籍参考: refs?.length
      ? {
          说明: '《秘笈大全》《遁甲演義》《統宗》《宝鉴》中与本盘干/门/星/神/时/格局直接对应的原文断语（qmdj-ts-lib 深度结构化检索，同格多书断语并出，出处见各条）',
          条目: refs.map((r) => ({
            类别: r.kind,
            键: r.key,
            落宫: r.gong,
            格名: r.name,
            原文: r.text,
            出处: r.docPath,
            存疑: r.uncertain ? '底本带「俟查」类残注，引用宜慎' : undefined,
          })),
        }
      : undefined,
  };
}

/** 完整 JSON 导出 */
export function chartToJson(chart: UnifiedQimenChart, engine: QimenEngine, solar: SolarTimeResult, extra?: ExportExtra): string {
  return JSON.stringify(buildExportPayload(chart, engine, solar, extra), null, 2);
}

/**
 * 完整 TOON 导出（与 JSON 同一载荷）。
 * 先 JSON 往返一次以按 JSON 语义剔除 undefined 字段，再交 TOON 编码。
 */
export function chartToToon(chart: UnifiedQimenChart, engine: QimenEngine, solar: SolarTimeResult, extra?: ExportExtra): string {
  const normalized = JSON.parse(JSON.stringify(buildExportPayload(chart, engine, solar, extra)));
  return toonEncode(normalized);
}

/** Markdown 导出（完整盘面：用神/生克/古法/典籍随附，供 AI 分步推理） */
export function chartToMarkdown(chart: UnifiedQimenChart, engine: QimenEngine, solar: SolarTimeResult, extra?: ExportExtra): string {
  const { refs, relations, inquiry, zhanfa, crossCheck } = extra ?? {};
  const m = chart.meta;
  const lines: string[] = [];

  const caliber = chart.layer === '时家' ? `${chart.school} · ${chart.method}法` : `${chart.layer}奇门`;
  lines.push(`# 奇门遁甲排盘（${caliber}）`);
  lines.push('');
  if (solar.applied) {
    lines.push(`- 排盘时间：真太阳时 ${fmt(solar.date)}（输入 ${fmt(solar.standardDate)}，总修正 ${formatOffset(solar.offsetMinutes ?? 0)} = 经度 ${formatOffset(solar.longitudeCorrectionMinutes ?? 0)} + 均时差 ${formatOffset(solar.eotMinutes ?? 0)}）`);
    lines.push(`- 地点：${solar.place}（东经 ${solar.longitude?.toFixed(2)}°${solar.timezone ? `，时区 ${solar.timezone}` : ''}）`);
  } else {
    lines.push(`- 排盘时间：${fmt(solar.date)}（钟表时间，未启用真太阳时）`);
  }
  if (m.lunarText) lines.push(`- 农历：${m.lunarText}`);
  lines.push(`- 四柱：${[m.siZhu.year, m.siZhu.month, m.siZhu.day, m.siZhu.hour].filter(Boolean).join(' ')}`);
  lines.push(`- 定局依据：${juBasisDetail(chart)}`);
  lines.push(
    `- 局：${juBasisText(chart)} ${m.dun}${m.ju}局${m.yuan ? ` ${m.yuan}` : ''}｜旬首 ${m.xunShou ?? '—'}${m.fuShou ? `（遁${m.fuShou}）` : ''}｜值符 ${m.zhiFu ?? '—'}${m.zhiFuGong ? `落${m.zhiFuGong}宫` : ''}｜值使 ${m.zhiShi ?? '—'}${m.zhiShiGong ? `落${m.zhiShiGong}宫` : ''}｜空亡 ${m.kongWang?.join('') || '—'}｜马星 ${m.maXing || '—'}`,
  );
  if (chart.layer !== '时家') {
    lines.push(`- 节气背景：${m.jieQi}（历法参考，本盘定局依据见上，非据此节气）`);
  }
  if (crossCheck) {
    if (crossCheck.consistent) {
      lines.push(`- 双引擎校验：与 ${crossCheck.referenceName} 同参对比一致 ✓（${crossCheck.scope}）`);
    } else {
      lines.push(`- 双引擎校验：与 ${crossCheck.referenceName} 存在 ${crossCheck.diffs.length} 处差异（口径或上游实现差异，AI 采信本盘为准）：${crossCheck.diffs.slice(0, 6).join('；')}${crossCheck.diffs.length > 6 ? ' 等' : ''}`);
    }
  }
  if (inquiry) {
    lines.push(`- 所占何事：${getTopic(inquiry.topicId).label}${inquiry.subject ? `｜事由：${inquiry.subject}` : ''}${inquiry.birthYear ? `｜求测人生年：${inquiry.birthYear}（年命见用神表）` : ''}`);
  }
  lines.push('');

  // 用神定位（断盘第一步：按占类自动取用并评估状态）
  if (inquiry) {
    lines.push(`## 用神定位（${inquiry.yongshen.topicLabel}${inquiry.yongshen.note ? `；${inquiry.yongshen.note}` : ''}）`);
    lines.push('');
    lines.push('| 用神 | 符号 | 落宫 | 同宫组合 | 状态（旺衰/宫生克/与日干宫/标记） |');
    lines.push('|---|---|---|---|---|');
    for (const e of inquiry.yongshen.entries) {
      const state = [e.wangShuai && `旺衰:${e.wangShuai}`, e.gongRelation, e.vsDayGong, e.marks?.join('·'), e.note]
        .filter(Boolean)
        .join('；');
      lines.push(
        `| ${e.role} | ${e.symbol} | ${e.missing ? '盘面未见' : `${e.gong}宫·${e.direction}`} | ${e.cohabit ?? ''} | ${state || '—'} |`,
      );
    }
    lines.push('');
  }

  lines.push('| 宫位 | 八神 | 九星 | 八门 | 天盘 | 地盘 | 暗干 | 标记/备注 |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const p of chart.palaces) {
    const notes: string[] = [...p.marks];
    if (p.extras) {
      for (const [k, v] of Object.entries(p.extras)) {
        notes.push(k === '星' ? `星${v}` : k === '门' ? `门${v}` : `${k}:${v}`);
      }
    }
    lines.push(
      `| ${GONG_TRIGRAMS[p.gong]}${p.gong}·${GONG_DIRECTIONS[p.gong]} | ${p.god ?? ''} | ${p.star ?? ''} | ${p.gate ?? ''} | ${p.tianPanGan.join(' ')} | ${p.diPanGan.join(' ')} | ${p.hiddenGan ?? ''} | ${notes.join('；')} |`,
    );
  }

  // 生克关系（机器预计算，AI 勿再自行推五行链）
  if (relations) {
    lines.push('');
    lines.push('## 生克关系（机器预计算）');
    lines.push('');
    lines.push(`- 全局：${relationsSummary(relations)}`);
    lines.push('');
    lines.push('| 宫 | 天地盘干生克 | 门与宫 | 星与宫 |');
    lines.push('|---|---|---|---|');
    for (const p of relations.palaces) {
      lines.push(
        `| ${GONG_TRIGRAMS[p.gong]}${p.gong} | ${p.ganGan.join('；') || '—'} | ${p.menGong?.text ?? '—'} | ${p.xingGong ?? '—'} |`,
      );
    }
  }

  if (chart.patterns?.length) {
    lines.push('');
    lines.push(`## 格局（${chart.patterns.length}）`);
    for (const pt of chart.patterns) {
      lines.push(`- **${pt.name}**${pt.kind ? `（${pt.kind}${pt.gong ? `，${pt.gong}宫` : ''}）` : pt.gong ? `（${pt.gong}宫）` : ''}`);
      if (pt.note) {
        for (const noteLine of pt.note.split('\n').filter(Boolean)) {
          lines.push(`  ${noteLine}`);
        }
      }
    }
  }

  // 占法要旨：该占类的古法原文（分类论断全套 + 相关占目）
  if (zhanfa && (zhanfa.lunDuan.length || zhanfa.zhanMu.length)) {
    lines.push('');
    lines.push(`## 占法要旨（《奇門遁甲秘笈大全》${zhanfa.topicId}占古法）`);
    lines.push('');
    lines.push('> 断此类事的传统方法，AI 应以此为纲结合本盘用神状态推理。');
    if (zhanfa.lunDuan.length) {
      lines.push('');
      lines.push(`### 分类论断（卷十一~十四 · ${zhanfa.topicId}占）`);
      for (const e of zhanfa.lunDuan) {
        lines.push(`- **${e.title}**：${e.text.split('\n').filter(Boolean).join(' ')}`);
      }
    }
    if (zhanfa.zhanMu.length) {
      lines.push('');
      lines.push('### 相关占目（卷七~十）');
      for (const e of zhanfa.zhanMu) {
        lines.push(`- **${e.title}**：${e.text.split('\n').filter(Boolean).join(' ')}`);
      }
    }
  }

  if (refs?.length) {
    lines.push('');
    lines.push(`## 典籍参考（${refs.length} 条，多书互证）`);
    lines.push('');
    lines.push('> 按本盘 干/门/星/神/时/格局 自动检索的原文断语（《秘笈大全》《遁甲演義》《統宗》《宝鉴》，qmdj-ts-lib 深度结构化）。同名格局多书断语并出，出处路径首段为书（qmmj/dyyy/tz/bj），可互证参断。');
    let lastKind = '';
    for (const r of refs) {
      if (r.kind !== lastKind) {
        lines.push('');
        lines.push(`### ${r.kind}`);
        lastKind = r.kind;
      }
      const head = `- **${r.key}**${r.name && r.name !== r.key ? `「${r.name}」` : ''}${r.gong ? `（${r.gong}宫）` : ''}`;
      const body = r.text.split('\n').filter(Boolean).join(' ');
      lines.push(`${head}：${body}${r.uncertain ? '（⚠ 原文存疑：底本带「俟查」类残注，引用宜慎）' : ''}`);
    }
  }

  lines.push('');
  lines.push(`> 引擎：${engine.name}（npm: ${engine.pkg}，${engine.license}）· 晚子时口径：${engine.lateZi} · 流派口径见标题，不同流派结果勿混用 · 典籍底本：ctext.org res=953105（秘笈大全）+ 维基文库（演義/統宗/宝鉴）`);
  return lines.join('\n');
}
