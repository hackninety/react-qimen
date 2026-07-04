import type { UnifiedQimenChart } from '@/engines/types';
import { LUOSHU_GRID } from '@/engines/types';
import { PalaceCell } from './PalaceCell';

export function NinePalaceGrid({ chart }: { chart: UnifiedQimenChart }) {
  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-1.5">
        {LUOSHU_GRID.flat().map((gong) => {
          const palace = chart.palaces[gong - 1];
          return (
            <PalaceCell
              key={gong}
              palace={palace}
              isZhiFu={chart.meta.zhiFuGong === gong}
              isZhiShi={chart.meta.zhiShiGong === gong}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/60 px-1">
        <span>上南下北 · 左东右西</span>
        <span>{chart.school} · {chart.method}法</span>
      </div>
    </div>
  );
}
