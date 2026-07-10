/**
 * 五行生克逻辑（纯计算，区别于 utils/wuxing.ts 的展示着色）。
 * 干/支/门/星/宫的五行归属与两两生克关系——预计算给 AI，LLM 不擅长机械推五行链。
 */

export type WuXing = '木' | '火' | '土' | '金' | '水';

/** 相生：木→火→土→金→水→木 */
const SHENG: Record<WuXing, WuXing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
/** 相克：木→土、土→水、水→火、火→金、金→木 */
const KE: Record<WuXing, WuXing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export const GAN_WX: Record<string, WuXing> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

export const ZHI_WX: Record<string, WuXing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

/** 八门（含鸣法中门）五行，按首字 */
export const GATE_WX: Record<string, WuXing> = {
  休: '水', 生: '土', 伤: '木', 杜: '木', 景: '火', 死: '土', 惊: '金', 开: '金', 中: '土',
};

/** 九星五行，按核心字 */
export const STAR_WX: Record<string, WuXing> = {
  蓬: '水', 芮: '土', 冲: '木', 辅: '木', 英: '火', 禽: '土', 心: '金', 柱: '金', 任: '土',
};

/** 洛书九宫五行 */
export const GONG_WX: Record<number, WuXing> = {
  1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火',
};

export function ganWx(gan: string): WuXing | undefined {
  return GAN_WX[gan?.[0]];
}
export function gateWx(gate?: string): WuXing | undefined {
  return gate ? GATE_WX[gate[0]] : undefined;
}
export function starWx(star?: string): WuXing | undefined {
  const core = star?.replace(/天/g, '')[0];
  return core ? STAR_WX[core] : undefined;
}

/** a 对 b 的关系（以 a 为主语） */
export type WxRelation = '生' | '克' | '被生' | '被克' | '比和';

export function relationOf(a: WuXing, b: WuXing): WxRelation {
  if (a === b) return '比和';
  if (SHENG[a] === b) return '生';
  if (KE[a] === b) return '克';
  if (SHENG[b] === a) return '被生';
  return '被克';
}

/** 「庚金克乙木」式描述 */
export function describeRelation(aName: string, a: WuXing, bName: string, b: WuXing): string {
  const r = relationOf(a, b);
  switch (r) {
    case '比和': return `${aName}${a}与${bName}${b}比和`;
    case '生': return `${aName}${a}生${bName}${b}`;
    case '克': return `${aName}${a}克${bName}${b}`;
    case '被生': return `${bName}${b}生${aName}${a}`;
    case '被克': return `${bName}${b}克${aName}${a}`;
  }
}
