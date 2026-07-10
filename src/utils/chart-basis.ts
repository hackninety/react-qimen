import type { UnifiedQimenChart } from '@/engines/types';

/**
 * 各盘类的「定局依据」文本，用于盘面抬头与导出。
 *
 * 修正历史缺陷：年/月/日家曾误显示「排盘当天的节气」（如年家显示小暑），
 * 但它们根本不据此定局——年家按太岁年（立春换岁）、月家按节气月、
 * 日家按日干支、只有时家才按节气三元定局。
 */
export function juBasisText(chart: UnifiedQimenChart): string {
  const { siZhu, jieQi } = chart.meta;
  switch (chart.layer) {
    case '年家':
      return siZhu.year ? `太岁${siZhu.year}年` : '太岁年';
    case '月家':
      return siZhu.month ? `${siZhu.month[1]}月` : '节气月';
    case '日家':
      return siZhu.day ? `${siZhu.day}日` : '日干支';
    default:
      return jieQi; // 时家：节气三元定局
  }
}

/** 「定局依据」更完整的说明（含定局法/换局锚点），用于 AI 导出，避免误读 */
export function juBasisDetail(chart: UnifiedQimenChart): string {
  // 部分引擎（jelly）给出年/月/日家定局锚点节气（年家恒立春、月家为该月之节）
  const anchor = chart.meta.juAnchorJieQi ? `，定局锚点节气 ${chart.meta.juAnchorJieQi}` : '';
  switch (chart.layer) {
    case '年家':
      return `太岁 ${chart.meta.siZhu.year} 年定局（自立春换岁，与排盘当天节气无关${anchor}）`;
    case '月家':
      return `节气月 ${chart.meta.siZhu.month?.[1] ?? ''}月 定局${anchor ? `（${anchor.slice(1)}）` : ''}`;
    case '日家':
      return `日干支 ${chart.meta.siZhu.day} 定局${anchor ? `（${anchor.slice(1)}）` : ''}`;
    default:
      return `节气 ${chart.meta.jieQi} · ${chart.method}法三元定局`;
  }
}

/** 「当日节气」对时/日家是定局背景，对月/年家仅为排盘时刻的历法背景 */
export function jieQiLabel(chart: UnifiedQimenChart): string {
  return chart.layer === '时家' ? '节气' : '当日节气';
}
