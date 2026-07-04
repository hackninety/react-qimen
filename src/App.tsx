import { useMemo, useState } from 'react';
import type { JuMethod, QimenEngineId, School, UnifiedQimenChart } from './engines/types';
import { DEFAULT_ENGINE_ID, getQimenEngine, listEnginesBySchool, resolveMethod } from './engines/registry';
import { ControlBar } from './components/ControlBar';
import { NinePalaceGrid } from './components/NinePalaceGrid';
import { MetaPanel } from './components/MetaPanel';
import { PatternsPanel } from './components/PatternsPanel';
import { fromInputValue, toInputValue } from './utils/datetime';

type ComputeResult = { ok: true; chart: UnifiedQimenChart } | { ok: false; error: string };

export default function App() {
  const [dateStr, setDateStr] = useState(() => toInputValue(new Date()));
  const [school, setSchool] = useState<School>('时家转盘');
  const [engineId, setEngineId] = useState<QimenEngineId>(DEFAULT_ENGINE_ID);
  const [method, setMethod] = useState<JuMethod>('拆补');

  const engine = getQimenEngine(engineId);
  const activeMethod = resolveMethod(engine, method);

  const result = useMemo<ComputeResult>(() => {
    const date = fromInputValue(dateStr);
    if (!date) return { ok: false, error: '时间格式无效' };
    try {
      return { ok: true, chart: engine.compute({ date, method: activeMethod }) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [engine, dateStr, activeMethod]);

  const handleSchoolChange = (s: School) => {
    setSchool(s);
    const first = listEnginesBySchool(s)[0];
    if (first) {
      setEngineId(first.id);
      setMethod(first.methods[0]);
    }
  };

  const handleEngineChange = (id: QimenEngineId) => {
    setEngineId(id);
    setMethod(resolveMethod(getQimenEngine(id), method));
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold text-[var(--color-gold-light)]">
          奇门遁甲 · 排盘
          <span className="ml-2 text-xs font-normal text-muted-foreground">多引擎插件式 · 时家转盘 / 飞盘鸣法</span>
        </h1>
      </header>

      <ControlBar
        dateStr={dateStr}
        school={school}
        engine={engine}
        method={activeMethod}
        onDateChange={setDateStr}
        onSchoolChange={handleSchoolChange}
        onEngineChange={handleEngineChange}
        onMethodChange={setMethod}
      />

      {!result.ok ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          排盘失败：{result.error}
          <p className="mt-1 text-xs text-muted-foreground">可尝试切换引擎或调整时间；各引擎由第三方算法库驱动，能力见下方说明。</p>
        </div>
      ) : (
        <main className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)]">
          <NinePalaceGrid chart={result.chart} />
          <div className="space-y-4">
            <MetaPanel chart={result.chart} engine={engine} />
            <PatternsPanel patterns={result.chart.patterns ?? []} />
          </div>
        </main>
      )}

      <footer className="pt-2 text-center text-[11px] text-muted-foreground/60">
        算法均来自开源上游库（npm 直接依赖，非 fork）· 仅供学习研究
      </footer>
    </div>
  );
}
