import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { JuMethod, QimenEngineId, School, UnifiedQimenChart } from './engines/types';
import { DEFAULT_ENGINE_ID, getQimenEngine, listEnginesBySchool, resolveMethod } from './engines/registry';
import { ControlBar } from './components/ControlBar';
import { SolarTimeControl } from './components/SolarTimeControl';
import { NinePalaceGrid } from './components/NinePalaceGrid';
import { MetaPanel } from './components/MetaPanel';
import { PatternsPanel } from './components/PatternsPanel';
import { fromInputValue, toInputValue } from './utils/datetime';
import { defaultSolarTimeSetting, resolveSolarTime, type SolarTimeSetting } from './utils/true-solar-time';

type ComputeResult = { ok: true; chart: UnifiedQimenChart } | { ok: false; error: string };

export default function App() {
  const [dateStr, setDateStr] = useState(() => toInputValue(new Date()));
  const [school, setSchool] = useState<School>('时家转盘');
  const [engineId, setEngineId] = useState<QimenEngineId>(DEFAULT_ENGINE_ID);
  const [method, setMethod] = useState<JuMethod>('拆补');
  const [solarSetting, setSolarSetting] = useState<SolarTimeSetting>(defaultSolarTimeSetting);

  const engine = getQimenEngine(engineId);
  const activeMethod = resolveMethod(engine, method);

  const solar = useMemo(() => {
    const date = fromInputValue(dateStr);
    return resolveSolarTime(date ?? new Date(), solarSetting);
  }, [dateStr, solarSetting]);

  const result = useMemo<ComputeResult>(() => {
    if (!fromInputValue(dateStr)) return { ok: false, error: '时间格式无效' };
    try {
      return { ok: true, chart: engine.compute({ date: solar.date, method: activeMethod }) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [engine, dateStr, solar, activeMethod]);

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
    <div className="mx-auto max-w-5xl px-3 py-4 space-y-3">
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

      <SolarTimeControl setting={solarSetting} result={solar} onChange={setSolarSetting} />

      {!result.ok ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          排盘失败：{result.error}
          <p className="mt-1 text-xs text-muted-foreground">可尝试切换引擎或调整时间；各引擎由第三方算法库驱动，能力见页脚说明。</p>
        </div>
      ) : (
        <main className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)]">
          <NinePalaceGrid chart={result.chart} />
          <div className="space-y-4">
            <MetaPanel chart={result.chart} engine={engine} solar={solar} />
            <PatternsPanel patterns={result.chart.patterns ?? []} />
          </div>
        </main>
      )}

      <footer className="border-t border-border/50 pt-3 text-[11px] leading-5 text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-foreground/80">{engine.name}</span>
          <span className="rounded bg-secondary px-1.5">{engine.pkg}</span>
          <span className="rounded bg-secondary px-1.5">{engine.license}</span>
          <a
            href={engine.homepage}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[var(--color-gold)]/80 hover:text-[var(--color-gold-light)]"
          >
            仓库 <ExternalLink size={10} />
          </a>
          <span>{engine.notes}</span>
        </div>
        <p className="mt-1 text-center text-muted-foreground/60">算法均来自开源上游库（npm 直接依赖，非 fork）· 仅供学习研究</p>
      </footer>
    </div>
  );
}
