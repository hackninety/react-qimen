import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Moon, Sun } from 'lucide-react';
import type { ChartLayer, JuMethod, QimenEngineId, School, UnifiedQimenChart } from './engines/types';
import { CHART_LAYERS } from './engines/types';
import { DEFAULT_ENGINE_ID, getQimenEngine, listEnginesByLayer, listEnginesBySchool, listQimenEngines, resolveLayer, resolveMethod } from './engines/registry';
import { usePersistentState } from './hooks/usePersistentState';
import { ControlBar } from './components/ControlBar';
import { SolarTimeControl } from './components/SolarTimeControl';
import { ArchivePanel } from './components/ArchivePanel';
import { CompareView } from './components/CompareView';
import { NinePalaceGrid } from './components/NinePalaceGrid';
import { BasicInfoPanel } from './components/BasicInfoPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { GongDetailPanel } from './components/GongDetailPanel';
import { PatternsPanel } from './components/PatternsPanel';
import { ExportPanel } from './components/ExportPanel';
import { CanonRefsPanel } from './components/CanonRefsPanel';
import { InquiryBar } from './components/InquiryBar';
import { useCanonRefs } from './hooks/useCanonRefs';
import { useZhanFa } from './hooks/useZhanFa';
import { TOPICS } from './lib/yongshen-rules';
import { insertEntry, isArchiveList, makeArchiveEntry, removeEntry, type ArchiveEntry } from './utils/archive';
import { crossCheckChart } from './utils/cross-check';
import { buildRelations } from './utils/relations';
import { locateYongShen } from './utils/yongshen';
import { fromInputValue, toInputValue } from './utils/datetime';
import { defaultSolarTimeSetting, resolveSolarTime, type SolarTimeSetting } from './utils/true-solar-time';

// 典籍抽屉懒加载：react-markdown 与书卷载荷不进首屏包
const CanonDrawer = lazy(() => import('./components/CanonDrawer'));

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
  // 起局参数持久化（localStorage）：刷新后由引擎按同参数重算，不缓存派生盘面
  const [dateStr, setDateStr] = usePersistentState('dateStr', () => toInputValue(new Date()), (v) => typeof v === 'string' && fromInputValue(v) !== null);
  const [layer, setLayer] = usePersistentState<ChartLayer>('layer', '时家', (v) => CHART_LAYERS.includes(v as ChartLayer));
  // 流派由引擎派生（engine.school），不单独持久化——保证脏数据回退后流派/引擎恒一致
  const [engineId, setEngineId] = usePersistentState<QimenEngineId>('engineId', DEFAULT_ENGINE_ID, (v) => listQimenEngines().some((e) => e.id === v));
  const [method, setMethod] = usePersistentState<JuMethod>('method', '拆补', (v) => typeof v === 'string');
  const [solarSetting, setSolarSetting] = usePersistentState<SolarTimeSetting>('solarSetting', defaultSolarTimeSetting, (v) => typeof v === 'object' && v !== null && 'enabled' in v && 'mode' in v);
  // 所占何事：占类决定用神取用与注入的古法；生年定年命落宫
  const [topicId, setTopicId] = usePersistentState<string>('topicId', '综合', (v) => TOPICS.some((t) => t.id === v));
  const [subject, setSubject] = usePersistentState<string>('subject', '', (v) => typeof v === 'string');
  const [birthYear, setBirthYear] = usePersistentState<string>('birthYear', '', (v) => typeof v === 'string');
  // 历史盘存档：只存起局参数，载入时重算（上限 50 条）
  const [archive, setArchive] = usePersistentState<ArchiveEntry[]>('archive', [], isArchiveList);
  const [canon, setCanon] = useState<{ open: boolean; path?: string }>({ open: false });
  // 主题：存储优先，无存储时按时段（18:00~06:00 暗色）
  const [isDark, setIsDark] = usePersistentState(
    'isDark',
    () => {
      const h = new Date().getHours();
      return h >= 18 || h < 6;
    },
    (v) => typeof v === 'boolean',
  );

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', isDark);
    html.classList.toggle('light', !isDark);
  }, [isDark]);

  const engine = getQimenEngine(engineId);
  const school: School = engine.school;
  const activeMethod = resolveMethod(engine, method);
  const activeLayer = resolveLayer(engine, layer);

  const solar = useMemo(() => {
    const date = fromInputValue(dateStr);
    return resolveSolarTime(date ?? new Date(), solarSetting);
  }, [dateStr, solarSetting]);

  const result = useMemo<ComputeResult>(() => {
    if (!fromInputValue(dateStr)) return { ok: false, error: '时间格式无效' };
    try {
      return { ok: true, chart: engine.compute({ date: solar.date, method: activeMethod, layer: activeLayer }) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [engine, dateStr, solar, activeMethod, activeLayer]);

  // 切盘类：当前引擎不支持新盘类时，切到支持它的首个引擎
  const handleLayerChange = (l: ChartLayer) => {
    setLayer(l);
    if (!engine.layers.includes(l)) {
      const first = listEnginesByLayer(l)[0];
      if (first) {
        setEngineId(first.id);
        setMethod(first.methods[0]);
      }
    }
  };

  const handleSchoolChange = (s: School) => {
    const first = listEnginesBySchool(s)[0];
    if (first) {
      setEngineId(first.id); // school 随之派生为 s
      setMethod(first.methods[0]);
    }
  };

  const handleEngineChange = (id: QimenEngineId) => {
    setEngineId(id);
    setMethod(resolveMethod(getQimenEngine(id), method));
  };

  const handleArchiveSave = () => {
    if (!result.ok) return;
    const entry = makeArchiveEntry(
      { dateStr, layer: activeLayer, engineId, method: activeMethod, solarSetting, topicId, subject, birthYear },
      result.chart,
    );
    setArchive((list) => insertEntry(list, entry));
  };

  const handleArchiveLoad = (e: ArchiveEntry) => {
    setDateStr(e.dateStr);
    setLayer(e.layer);
    setEngineId(e.engineId);
    setMethod(e.method);
    setSolarSetting(e.solarSetting);
    setTopicId(e.topicId);
    setSubject(e.subject);
    setBirthYear(e.birthYear);
  };

  // 盘面 → 典籍参考（qmdj-ts-lib/keying 动态加载）
  const canonRefs = useCanonRefs(result.ok ? result.chart : undefined);
  // 占类 → 古法原文（qmdj-ts-lib/zhanmu 动态加载）
  const zhanfa = useZhanFa(topicId);
  // 求测人生年（4 位才生效，1700~2100 合理区间）
  const birthYearNum = useMemo(() => {
    const n = Number(birthYear);
    return /^\d{4}$/.test(birthYear) && n >= 1700 && n <= 2100 ? n : undefined;
  }, [birthYear]);
  // 用神定位与生克预计算（同步纯函数）
  const yongshen = useMemo(
    () => (result.ok ? locateYongShen(result.chart, topicId, { birthYear: birthYearNum }) : null),
    [result, topicId, birthYearNum],
  );
  const relations = useMemo(() => (result.ok ? buildRelations(result.chart) : null), [result]);
  // 参照引擎交叉校验（时家同定局法静默复排对比）
  const crossCheck = useMemo(
    () => (result.ok ? crossCheckChart(result.chart, { date: solar.date, method: activeMethod, layer: activeLayer }) : null),
    [result, solar, activeMethod, activeLayer],
  );
  const exportExtra = useMemo(
    () => ({
      refs: canonRefs,
      relations,
      inquiry: yongshen ? { topicId, subject: subject.trim() || undefined, birthYear: birthYearNum, yongshen } : null,
      zhanfa,
      crossCheck,
    }),
    [canonRefs, relations, yongshen, topicId, subject, birthYearNum, zhanfa, crossCheck],
  );

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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCanon({ open: true })}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm hover:bg-secondary transition-colors"
              title="典籍库：秘笈大全 · 遁甲演義 · 統宗 · 宝鉴（45 篇 · 997 节 · 全文检索）"
            >
              <BookOpen className="w-4 h-4 text-[var(--color-gold)]" />
              <span className="hidden sm:inline">典籍</span>
            </button>
            <button
              onClick={() => setIsDark((v) => !v)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="切换主题"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
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
              layer={activeLayer}
              school={school}
              engine={engine}
              method={activeMethod}
              onDateChange={setDateStr}
              onLayerChange={handleLayerChange}
              onSchoolChange={handleSchoolChange}
              onEngineChange={handleEngineChange}
              onMethodChange={setMethod}
            />
            <SolarTimeControl setting={solarSetting} result={solar} onChange={setSolarSetting} />
            <InquiryBar
              topicId={topicId}
              subject={subject}
              birthYear={birthYear}
              onTopicChange={setTopicId}
              onSubjectChange={setSubject}
              onBirthYearChange={setBirthYear}
            />
          </div>
        </Section>

        {/* 历史盘存档 */}
        <Section title={`历史盘存档${archive.length ? `（${archive.length}）` : ''}`} delay={0.03}>
          <ArchivePanel
            entries={archive}
            onSave={handleArchiveSave}
            onLoad={handleArchiveLoad}
            onDelete={(id) => setArchive((list) => removeEntry(list, id))}
          />
        </Section>

        {/* 双引擎校验：不一致时醒目提示，一致时静默增信一行 */}
        {result.ok && crossCheck && (
          crossCheck.consistent ? (
            <p className="px-1 text-[11px] text-muted-foreground/60">
              双引擎校验：与 {crossCheck.referenceName} 同参对比一致 ✓
            </p>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                双引擎校验：与 {crossCheck.referenceName} 存在 {crossCheck.diffs.length} 处差异（口径或上游实现差异）
              </p>
              <p className="mt-1 text-muted-foreground">
                {crossCheck.diffs.slice(0, 4).join('；')}
                {crossCheck.diffs.length > 4 ? ' 等' : ''}
              </p>
            </div>
          )
        )}

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

            {/* 多引擎对照：同刻两盘并排，差异宫高亮 */}
            <Section title="多引擎对照" delay={0.12}>
              <CompareView chart={result.chart} date={solar.date} />
            </Section>

            {/* 断局指引（含用神定位） */}
            <Section title="断局指引" delay={0.15}>
              <AnalysisPanel chart={result.chart} yongshen={yongshen ?? undefined} />
            </Section>

            {/* 格局 */}
            {(result.chart.patterns?.length ?? 0) > 0 && (
              <Section title={`格局断验（${result.chart.patterns!.length}）`} delay={0.2}>
                <PatternsPanel patterns={result.chart.patterns!} />
              </Section>
            )}

            {/* 典籍参考 */}
            <Section title={`典籍参考${canonRefs?.length ? `（${canonRefs.length}）` : ''}`} delay={0.22}>
              <CanonRefsPanel refs={canonRefs} onOpenDoc={(path) => setCanon({ open: true, path })} />
            </Section>

            {/* 九宫详解 */}
            <Section title="九宫详解" delay={0.25}>
              <GongDetailPanel chart={result.chart} />
            </Section>

            {/* 数据导出 & AI 分析 */}
            <Section title="数据导出 & AI 分析" delay={0.3}>
              <ExportPanel chart={result.chart} engine={engine} solar={solar} extra={exportExtra} />
            </Section>
          </>
        )}
      </main>

      {/* 底部：当前引擎信息 */}
      <footer className="border-t border-border/30 py-4">
        <div className="max-w-5xl mx-auto px-4 text-[11px] leading-5 text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
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
          <p className="mt-1 text-center text-muted-foreground/50">算法均来自开源上游库（npm 直接依赖，非 fork）· 典籍语料 qmdj-ts-lib（ctext 转录）· 仅供学习研究</p>
        </div>
      </footer>

      {canon.open && (
        <Suspense fallback={null}>
          <CanonDrawer onClose={() => setCanon({ open: false })} initialPath={canon.path} />
        </Suspense>
      )}
    </div>
  );
}
