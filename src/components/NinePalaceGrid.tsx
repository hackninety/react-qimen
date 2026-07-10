import { motion } from 'framer-motion';
import type { GongIndex, UnifiedQimenChart } from '@/engines/types';
import { LUOSHU_GRID } from '@/engines/types';
import { cn } from '@/utils/cn';
import { PalaceCell } from './PalaceCell';

interface Props {
  chart: UnifiedQimenChart;
  /** 对照视图差异宫高亮 */
  highlightGongs?: ReadonlySet<GongIndex>;
}

export function NinePalaceGrid({ chart, highlightGongs }: Props) {
  return (
    <div className="w-full">
      <div className="rounded-xl border border-border/50 overflow-hidden shadow-lg shadow-black/20">
        <div className="grid grid-cols-3 grid-rows-3 divide-x divide-y divide-border/30">
          {LUOSHU_GRID.flat().map((gong, index) => (
            <motion.div
              key={`${chart.engineId}-${gong}`}
              className={cn(highlightGongs?.has(gong) && 'ring-2 ring-inset ring-amber-500/70')}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
            >
              <PalaceCell
                palace={chart.palaces[gong - 1]}
                isZhiFu={chart.meta.zhiFuGong === gong}
                isZhiShi={chart.meta.zhiShiGong === gong}
                fuShou={chart.meta.fuShou}
              />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/60 px-1">
        <span>上南下北 · 左东右西</span>
        <span>{chart.layer === '时家' ? `${chart.school} · ${chart.method}法` : `${chart.layer}奇门`}</span>
      </div>
    </div>
  );
}
