/**
 * 盘面生克关系预计算（引擎无关）。
 *
 * LLM 擅长解释、不擅长机械推五行链——本模块把断盘要用的"算"全部做完：
 * 逐宫 天盘干×地盘干 生克、门与宫（迫/制/和/义）、星与宫；
 * 全盘伏吟/反吟、五不遇时、时干入墓。结果进导出与 Prompt。
 */
import type { GongIndex, UnifiedQimenChart } from '@/engines/types';
import { GONG_TRIGRAMS } from '@/engines/types';
import {
  describeRelation,
  ganWx,
  gateWx,
  GONG_WX,
  relationOf,
  starWx,
  type WxRelation,
} from '@/lib/wuxing-logic';

export interface PalaceRelations {
  gong: GongIndex;
  /** 天盘干对地盘干逐组描述（如「庚金克乙木」） */
  ganGan: string[];
  /** 门与宫：迫（门克宫，凶）/制（宫克门）/和（门生宫）/义（宫生门）/伏（比和） */
  menGong?: { type: '迫' | '制' | '和' | '义' | '伏'; text: string };
  /** 星与宫关系描述 */
  xingGong?: string;
}

export interface ChartRelations {
  palaces: PalaceRelations[];
  /** 干伏吟：全盘天盘干=地盘干 */
  ganFuYin: boolean;
  /** 星伏吟/反吟：九星皆居本位 / 皆居对冲宫 */
  xingFuYin: boolean;
  xingFanYin: boolean;
  /** 五不遇时（时干克日干，全盘蒙昧），命中时给出「甲日庚午时」式说明 */
  wuBuYuShi?: string;
  /** 时干入墓（戊戌/壬辰/丙戌/癸未/丁丑），命中时给出时柱 */
  shiGanRuMu?: string;
}

/** 门宫关系分类名（传统称谓） */
const MEN_GONG_TYPE: Record<WxRelation, PalaceRelations['menGong'] extends { type: infer T } | undefined ? T : never> = {
  克: '迫', // 门克宫
  被克: '制', // 宫克门
  生: '和', // 门生宫
  被生: '义', // 宫生门
  比和: '伏',
};

/** 九星本位宫 */
const STAR_HOME: Record<string, number> = {
  蓬: 1, 芮: 2, 冲: 3, 辅: 4, 禽: 5, 心: 6, 柱: 7, 任: 8, 英: 9,
};
/** 对冲宫 */
const OPPOSITE: Record<number, number> = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 };

/** 五不遇时：日干 → 时柱干支 */
const WU_BU_YU: Record<string, string> = {
  甲: '庚午', 乙: '辛巳', 丙: '壬辰', 丁: '癸卯', 戊: '甲寅',
  己: '乙丑', 庚: '丙子', 辛: '丁酉', 壬: '戊申', 癸: '己未',
};

/** 时干入墓时柱（烟波钓叟歌：戊戌壬辰兼丙戌，癸未丁丑亦同凶） */
const SHI_RU_MU = new Set(['戊戌', '壬辰', '丙戌', '癸未', '丁丑']);

export function buildRelations(chart: UnifiedQimenChart): ChartRelations {
  const palaces: PalaceRelations[] = [];
  let ganFuYinAll = true;
  let ganPairCount = 0;
  let starHomeHits = 0;
  let starOppHits = 0;
  let starChecked = 0;

  for (const p of chart.palaces) {
    const gongWx = GONG_WX[p.gong];
    const gongName = `${GONG_TRIGRAMS[p.gong]}宫`;

    // 天盘干 × 地盘干（逐组，寄宫多干全组合，上限 4 组防爆行）
    const ganGan: string[] = [];
    for (const t of p.tianPanGan) {
      for (const d of p.diPanGan) {
        const tw = ganWx(t);
        const dw = ganWx(d);
        if (!tw || !dw) continue;
        if (ganGan.length < 4) ganGan.push(describeRelation(t, tw, d, dw));
      }
    }
    // 干伏吟按集合判（寄宫多干如坤2「乙癸」，天地盘集合相同即伏）
    if (p.tianPanGan.length && p.diPanGan.length) {
      ganPairCount++;
      const tSet = [...p.tianPanGan].sort().join('');
      const dSet = [...p.diPanGan].sort().join('');
      if (tSet !== dSet) ganFuYinAll = false;
    }

    // 门与宫
    let menGong: PalaceRelations['menGong'];
    const gw = gateWx(p.gate);
    if (gw && gongWx && p.gate) {
      const rel = relationOf(gw, gongWx);
      const type = MEN_GONG_TYPE[rel];
      const phrase: Record<WxRelation, string> = {
        克: `${p.gate}(${gw})克${gongName}(${gongWx})`,
        被克: `${gongName}(${gongWx})克${p.gate}(${gw})`,
        生: `${p.gate}(${gw})生${gongName}(${gongWx})`,
        被生: `${gongName}(${gongWx})生${p.gate}(${gw})`,
        比和: `${p.gate}(${gw})与${gongName}(${gongWx})比和`,
      };
      menGong = { type, text: `${phrase[rel]}，门${type}` };
    }

    // 星与宫
    let xingGong: string | undefined;
    const sw = starWx(p.star);
    if (sw && gongWx && p.star) {
      xingGong = describeRelation(p.star, sw, gongName, gongWx);
    }

    // 伏吟/反吟计数（按星核心字，天禽随芮不计本位）
    for (const token of (p.star ?? '').replace(/天/g, '').split('/').join('').split('')) {
      const home = STAR_HOME[token];
      if (!home || home === 5 || p.gong === 5) continue;
      starChecked++;
      if (p.gong === home) starHomeHits++;
      if (p.gong === OPPOSITE[home]) starOppHits++;
    }

    palaces.push({ gong: p.gong, ganGan, menGong, xingGong });
  }

  const dayGz = chart.meta.siZhu.day;
  const hourGz = chart.meta.siZhu.hour;
  const wuBuYuShi =
    dayGz && hourGz && WU_BU_YU[dayGz[0]] === hourGz
      ? `${dayGz[0]}日${hourGz}时，时干克日干，诸事不宜`
      : undefined;
  const shiGanRuMu = hourGz && SHI_RU_MU.has(hourGz) ? `时柱${hourGz}，时干入墓，谋为暗昧` : undefined;

  return {
    palaces,
    ganFuYin: ganPairCount > 0 && ganFuYinAll,
    xingFuYin: starChecked >= 8 && starHomeHits === starChecked,
    xingFanYin: starChecked >= 8 && starOppHits === starChecked,
    wuBuYuShi,
    shiGanRuMu,
  };
}

/** 全局标志一句话汇总（导出/面板用） */
export function relationsSummary(r: ChartRelations): string {
  const parts: string[] = [];
  if (r.ganFuYin || r.xingFuYin) parts.push('全盘伏吟（宜静不宜动，事主拖延反复）');
  if (r.xingFanYin) parts.push('全盘反吟（事主反复颠倒，去而复返）');
  if (r.wuBuYuShi) parts.push(`五不遇时（${r.wuBuYuShi}）`);
  if (r.shiGanRuMu) parts.push(`时干入墓（${r.shiGanRuMu}）`);
  return parts.length ? parts.join('；') : '无伏吟反吟、五不遇时、时干入墓等全局凶兆';
}
