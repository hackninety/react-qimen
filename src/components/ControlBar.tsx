import { Clock } from 'lucide-react';
import type { ChartLayer, JuMethod, QimenEngine, QimenEngineId, School } from '@/engines/types';
import { CHART_LAYERS, SCHOOLS } from '@/engines/types';
import { listEnginesByLayer, listEnginesBySchool } from '@/engines/registry';
import { toInputValue } from '@/utils/datetime';
import { cn } from '@/utils/cn';

interface Props {
  dateStr: string;
  layer: ChartLayer;
  school: School;
  engine: QimenEngine;
  method: JuMethod;
  onDateChange(v: string): void;
  onLayerChange(l: ChartLayer): void;
  onSchoolChange(s: School): void;
  onEngineChange(id: QimenEngineId): void;
  onMethodChange(m: JuMethod): void;
}

const selectCls =
  'rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring';

const LAYER_HINT: Record<ChartLayer, string> = {
  时家: '按时辰起局，最常用',
  日家: '按日干支起局，观一日之机',
  月家: '按节气月起局，观一月大势',
  年家: '按太岁年起局，观一年吉凶',
};

export function ControlBar(p: Props) {
  const isShiJia = p.layer === '时家';
  // 时家按流派过滤，年月日家按盘类过滤
  const engines = isShiJia ? listEnginesBySchool(p.school) : listEnginesByLayer(p.layer);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 时间 */}
      <div className="flex items-center gap-1">
        <input
          type="datetime-local"
          value={p.dateStr}
          onChange={(e) => e.target.value && p.onDateChange(e.target.value)}
          className={selectCls}
        />
        <button
          onClick={() => p.onDateChange(toInputValue(new Date()))}
          className="flex items-center gap-1 rounded-md border border-input bg-secondary px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          title="用当前时间起局"
        >
          <Clock size={14} /> 此刻
        </button>
      </div>

      {/* 盘类：时/日/月/年家 */}
      <div className="flex rounded-md border border-input overflow-hidden">
        {CHART_LAYERS.map((l) => (
          <button
            key={l}
            onClick={() => p.onLayerChange(l)}
            title={LAYER_HINT[l]}
            className={cn(
              'px-2.5 py-1.5 text-sm transition-colors',
              l === p.layer
                ? 'bg-[var(--color-gold)]/25 text-[var(--color-gold-light)] font-semibold'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* 流派（仅时家有转盘/飞盘之分） */}
      {isShiJia && (
        <div className="flex rounded-md border border-input overflow-hidden">
          {SCHOOLS.map((s) => (
            <button
              key={s}
              onClick={() => p.onSchoolChange(s)}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                s === p.school
                  ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold-light)] font-semibold'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 引擎 */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        引擎
        <select value={p.engine.id} onChange={(e) => p.onEngineChange(e.target.value as QimenEngineId)} className={selectCls}>
          {engines.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>

      {/* 定局法（仅时家、且引擎支持多种定局法时显示；年月日家无定局法之分） */}
      {isShiJia && p.engine.methods.length > 1 && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          定局
          <select value={p.method} onChange={(e) => p.onMethodChange(e.target.value as JuMethod)} className={selectCls}>
            {p.engine.methods.map((m) => (
              <option key={m} value={m}>
                {m}法
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
