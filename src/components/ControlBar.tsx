import { Clock } from 'lucide-react';
import type { JuMethod, QimenEngine, QimenEngineId, School } from '@/engines/types';
import { SCHOOLS } from '@/engines/types';
import { listEnginesBySchool } from '@/engines/registry';
import { toInputValue } from '@/utils/datetime';
import { cn } from '@/utils/cn';

interface Props {
  dateStr: string;
  school: School;
  engine: QimenEngine;
  method: JuMethod;
  onDateChange(v: string): void;
  onSchoolChange(s: School): void;
  onEngineChange(id: QimenEngineId): void;
  onMethodChange(m: JuMethod): void;
}

const selectCls =
  'rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring';

export function ControlBar(p: Props) {
  const engines = listEnginesBySchool(p.school);

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

      {/* 流派 */}
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

      {/* 定局法（仅支持多种定局法的引擎显示） */}
      {p.engine.methods.length > 1 && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          定局
          <select
            value={p.method}
            onChange={(e) => p.onMethodChange(e.target.value as JuMethod)}
            className={selectCls}
          >
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
