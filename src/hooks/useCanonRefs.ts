/**
 * 盘面 → 典籍参考：把统一盘面喂给 qmdj-ts-lib/keying 的 lookupChart，
 * 得到《奇門遁甲秘笈大全》中与本盘直接对应的原文断语（十干克应/门静应/
 * 值时克应/三奇到宫/八神/格局/七十二局…），另附值符星、值使门的总断。
 * keying 模块动态导入，不进首屏包。
 */
import { useEffect, useState } from 'react';
import type { UnifiedQimenChart } from '@/engines/types';
import type { CanonRef } from 'qmdj-ts-lib/keying';

export type { CanonRef } from 'qmdj-ts-lib/keying';

export function buildLookupInput(chart: UnifiedQimenChart) {
  return {
    palaces: chart.palaces.map((p) => ({
      gong: p.gong,
      tianPanGan: p.tianPanGan,
      diPanGan: p.diPanGan,
      star: p.star,
      gate: p.gate,
      god: p.god,
    })),
    hourZhi: chart.meta.siZhu.hour[1],
    hourGan: chart.meta.siZhu.hour[0],
    patterns: chart.patterns?.map((pt) => pt.name),
    marks: [...new Set(chart.palaces.flatMap((p) => p.marks))],
  };
}

export function useCanonRefs(chart: UnifiedQimenChart | undefined): CanonRef[] | null {
  // 以盘面对象标记归属：切换盘面后旧结果自然失效，无需在 effect 内同步重置
  const [loaded, setLoaded] = useState<{ chart: UnifiedQimenChart; refs: CanonRef[] } | null>(null);

  useEffect(() => {
    if (!chart) return;
    let live = true;
    import('qmdj-ts-lib/keying')
      .then((keying) => {
        if (!live) return;
        const refs = keying.lookupChart(buildLookupInput(chart));
        // 附值符星总断与值使门总论（各一条，供 AI 掌握主星主门性情）
        const zhiFuLore = chart.meta.zhiFu ? keying.getStarLore(chart.meta.zhiFu) : undefined;
        if (zhiFuLore) {
          refs.push({ kind: '九星', key: `值符${zhiFuLore.star}总断`, text: zhiFuLore.text, docPath: zhiFuLore.docPath });
        }
        const zhiShiLore = chart.meta.zhiShi ? keying.getGateLore(chart.meta.zhiShi) : undefined;
        if (zhiShiLore) {
          refs.push({ kind: '门总断', key: `值使${zhiShiLore.gate}总论`, text: zhiShiLore.text, docPath: zhiShiLore.docPath });
        }
        setLoaded({ chart, refs });
      })
      .catch(() => {
        if (live) setLoaded({ chart, refs: [] });
      });
    return () => {
      live = false;
    };
  }, [chart]);

  return chart && loaded?.chart === chart ? loaded.refs : null;
}
