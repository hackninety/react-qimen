/** 五行着色：天干/八门/九星 → CSS 变量色 */

type WuXing = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const GAN_WUXING: Record<string, WuXing> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

/** 门首字 → 五行 */
const GATE_WUXING: Record<string, WuXing> = {
  休: 'water', 生: 'earth', 伤: 'wood', 杜: 'wood',
  景: 'fire', 死: 'earth', 惊: 'metal', 开: 'metal', 中: 'earth',
};

/** 星核心字 → 五行 */
const STAR_WUXING: Record<string, WuXing> = {
  蓬: 'water', 任: 'earth', 冲: 'wood', 辅: 'wood',
  英: 'fire', 芮: 'earth', 柱: 'metal', 心: 'metal', 禽: 'earth',
};

const COLOR_VAR: Record<WuXing, string> = {
  wood: 'var(--color-wood)',
  fire: 'var(--color-fire)',
  earth: 'var(--color-earth)',
  metal: 'var(--color-metal)',
  water: 'var(--color-water)',
};

export function ganColor(gan: string): string | undefined {
  const w = GAN_WUXING[gan?.[0]];
  return w ? COLOR_VAR[w] : undefined;
}

export function gateColor(gate: string): string | undefined {
  const w = GATE_WUXING[gate?.[0]];
  return w ? COLOR_VAR[w] : undefined;
}

export function starColor(star: string): string | undefined {
  const core = star?.replace(/天/g, '')[0];
  const w = STAR_WUXING[core];
  return w ? COLOR_VAR[w] : undefined;
}
