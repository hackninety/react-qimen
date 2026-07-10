import { useMemo, useState } from 'react';
import { Columns2 } from 'lucide-react';
import { getQimenEngine, listEnginesByLayer, resolveMethod } from '@/engines/registry';
import type { QimenEngineId, UnifiedQimenChart } from '@/engines/types';
import { diffCharts } from '@/utils/cross-check';
import { NinePalaceGrid } from './NinePalaceGrid';

interface Props {
  /** 当前主盘 */
  chart: UnifiedQimenChart;
  /** 主盘的排盘时刻（真太阳时已解析） */
  date: Date;
}

/**
 * 多引擎对照视图：同刻两引擎并排九宫，差异宫琥珀色描边高亮。
 * 引擎 B 按自身支持的定局法解读（口径标注在盘下），跨定局法对比时
 * 差异属口径不同而非错误。
 */
export function CompareView({ chart, date }: Props) {
  const [otherId, setOtherId] = useState<QimenEngineId | ''>('');
  const candidates = listEnginesByLayer(chart.layer).filter((e) => e.id !== chart.engineId);

  const other = useMemo(() => {
    if (!otherId) return null;
    const engine = getQimenEngine(otherId);
    const method = resolveMethod(engine, chart.method);
    try {
      return { engine, method, chart: engine.compute({ date, method, layer: chart.layer }) };
    } catch {
      return null;
    }
  }, [otherId, chart.layer, chart.method, date]);

  const diff = useMemo(() => (other ? diffCharts(chart, other.chart) : null), [chart, other]);

  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Columns2 size={13} className="text-[var(--color-gold)]/80" />
        对照引擎
        <select
          value={otherId}
          onChange={(e) => setOtherId(e.target.value as QimenEngineId | '')}
          className="rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">关闭对照</option>
          {candidates.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}（{e.school}）
            </option>
          ))}
        </select>
        {other && other.method !== chart.method && (
          <span className="text-amber-600 dark:text-amber-400">对方不支持 {chart.method}法，已按其 {other.method}法排盘</span>
        )}
      </label>

      {otherId && !other && (
        <p className="text-xs text-destructive">对照引擎排盘失败，请换一个引擎。</p>
      )}

      {other && diff && (
        <>
          <p className="text-xs leading-5 text-muted-foreground">
            {diff.consistent ? (
              <span className="text-green-500">两盘核心要素一致 ✓（局/值符值使/九宫天盘干·门·星·神）</span>
            ) : (
              <>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{diff.diffs.length} 处差异</span>
                {chart.school !== other.engine.school || chart.method !== other.method
                  ? '（流派/定局法不同，差异属口径而非错误）'
                  : '（同口径差异，宜细究）'}
                ：{diff.diffs.slice(0, 5).join('；')}
                {diff.diffs.length > 5 ? ' 等' : ''}
              </>
            )}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-center text-xs text-muted-foreground">
                <b className="text-foreground/85">{getQimenEngine(chart.engineId).name}</b> · {chart.method}法（主盘）
              </p>
              <NinePalaceGrid chart={chart} highlightGongs={diff.gongs} />
            </div>
            <div>
              <p className="mb-1.5 text-center text-xs text-muted-foreground">
                <b className="text-foreground/85">{other.engine.name}</b> · {other.method}法
              </p>
              <NinePalaceGrid chart={other.chart} highlightGongs={diff.gongs} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
