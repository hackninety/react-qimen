/** 五行着色：干/支/卦/星/门/神 → CSS 变量色（支持部分匹配，如「天芮/天禽」「禽芮」） */

type WuXing = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const COLOR_VAR: Record<WuXing, string> = {
  wood: 'var(--color-wood)',
  fire: 'var(--color-fire)',
  earth: 'var(--color-earth)',
  metal: 'var(--color-metal)',
  water: 'var(--color-water)',
};

const ELEMENT_MAP: Record<string, WuXing> = {
  // 天干
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
  // 地支
  子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood', 辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth', 申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
  // 八卦/宫名
  坎: 'water', 坤: 'earth', 震: 'wood', 巽: 'wood', 中: 'earth',
  乾: 'metal', 兑: 'metal', 艮: 'earth', 离: 'fire',
  // 九星（核心字）
  蓬: 'water', 芮: 'earth', 冲: 'wood', 辅: 'wood', 禽: 'earth',
  心: 'metal', 柱: 'metal', 任: 'earth', 英: 'fire',
  // 八门/九门（首字）
  休: 'water', 生: 'earth', 伤: 'wood', 杜: 'wood',
  景: 'fire', 死: 'earth', 惊: 'metal', 开: 'metal',
  // 八神/九神
  值符: 'earth', 腾蛇: 'fire', 螣蛇: 'fire', 太阴: 'metal', 六合: 'wood',
  白虎: 'metal', 玄武: 'water', 九地: 'earth', 九天: 'metal',
  勾陈: 'earth', 朱雀: 'fire', 太常: 'earth',
};

/** 名称 → 五行颜色（CSS 变量值）；先整词匹配，再部分匹配 */
export function wuxingColor(name?: string): string | undefined {
  if (!name) return undefined;
  const direct = ELEMENT_MAP[name];
  if (direct) return COLOR_VAR[direct];
  for (const [key, wx] of Object.entries(ELEMENT_MAP)) {
    if (name.includes(key)) return COLOR_VAR[wx];
  }
  return undefined;
}
