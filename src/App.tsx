import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Moon, Sun } from 'lucide-react';
import type { JuMethod, QimenEngineId, School, UnifiedQimenChart } from './engines/types';
import { DEFAULT_ENGINE_ID, getQimenEngine, listEnginesBySchool, resolveMethod } from './engines/registry';
import { ControlBar } from './components/ControlBar';
import { SolarTimeControl } from './components/SolarTimeControl';
import { NinePalaceGrid } from './components/NinePalaceGrid';
import { BasicInfoPanel } from './components/BasicInfoPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { GongDetailPanel } from './components/GongDetailPanel';
import { PatternsPanel } from './components/PatternsPanel';
import { ExportPanel } from './components/ExportPanel';
import { fromInputValue, toInputValue } from './utils/datetime';
import { defaultSolarTimeSetting, resolveSolarTime, type SolarTimeSetting } from './utils/true-solar-time';

type ComputeResult = { ok: true; chart: UnifiedQimenChart } | { ok: false; error: string };

/** 带标题的玻璃卡片区块 */
function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.section
      className="glass-card rounded-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <h2 className="text-sm font-semibold text-[var(--color-gold)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-[var(--color-gold)]" />
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export default function App() {
  const [dateStr, setDateStr] = useState(() => toInputValue(new Date()));
  const [school, setSchool] = useState<School>('时家转盘');
  const [engineId, setEngineId] = useState<QimenEngineId>(DEFAULT_ENGINE_ID);
  const [method, setMethod] = useState<JuMethod>('拆补');
  const [solarSetting, setSolarSetting] = useState<SolarTimeSetting>(defaultSolarTimeSetting);
  // 18:00~06:00 默认暗色
  const [isDark, setIsDark] = useState(() => {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  });

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', isDark);
    html.classList.toggle('light', !isDark);
  }, [isDark]);

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
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-card/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)]/20 flex items-center justify-center">
              <span className="text-[var(--color-gold)] font-serif font-bold text-sm">奇</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-serif tracking-widest text-foreground leading-tight">奇门遁甲</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">多引擎插件式 · 时家转盘 / 飞盘鸣法</p>
            </div>
          </div>
          <button
            onClick={() => setIsDark((v) => !v)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="切换主题"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/30 to-transparent" />
      </header>

      {/* 主体 — 单列卡片流 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-5">
        {/* 起局控制 */}
        <Section title="起局" delay={0}>
          <div className="space-y-2.5">
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
          </div>
        </Section>

        {!result.ok ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            排盘失败：{result.error}
            <p className="mt-1 text-xs text-muted-foreground">可尝试切换引擎或调整时间；各引擎由第三方算法库驱动。</p>
          </div>
        ) : (
          <>
            {/* 基础信息 */}
            <Section title="基础信息" delay={0.05}>
              <BasicInfoPanel chart={result.chart} engine={engine} solar={solar} />
            </Section>

            {/* 九宫格 */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="w-full max-w-2xl">
                <NinePalaceGrid chart={result.chart} />
              </div>
            </motion.div>

            {/* 断局指引 */}
            <Section title="断局指引" delay={0.15}>
              <AnalysisPanel chart={result.chart} />
            </Section>

            {/* 格局 */}
            {(result.chart.patterns?.length ?? 0) > 0 && (
              <Section title={`格局断验（${result.chart.patterns!.length}）`} delay={0.2}>
                <PatternsPanel patterns={result.chart.patterns!} />
              </Section>
            )}

            {/* 九宫详解 */}
            <Section title="九宫详解" delay={0.25}>
              <GongDetailPanel chart={result.chart} />
            </Section>

            {/* 数据导出 & AI 分析 */}
            <Section title="数据导出 & AI 分析" delay={0.3}>
              <ExportPanel chart={result.chart} engine={engine} solar={solar} />
            </Section>
          </>
        )}
      </main>

      {/* 底部：当前引擎信息 */}
      <footer className="border-t border-border/30 py-4">
        <div className="max-w-5xl mx-auto px-4 text-[11px] leading-5 text-muted-foreground">
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
          <p className="mt-1 text-center text-muted-foreground/50">算法均来自开源上游库（npm 直接依赖，非 fork）· 仅供学习研究</p>
        </div>
      </footer>
    </div>
  );
}
