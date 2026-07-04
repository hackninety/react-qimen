import { Compass, ShieldAlert, Sparkles, Info } from 'lucide-react';
import type { UnifiedQimenChart } from '@/engines/types';
import { buildGuidance } from '@/utils/analysis';
import { wuxingColor } from '@/utils/wuxing';

export function AnalysisPanel({ chart }: { chart: UnifiedQimenChart }) {
  const g = buildGuidance(chart);

  return (
    <div className="space-y-4">
      {/* 吉门方位 */}
      {g.luckyGates.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20">
          <Compass className="w-5 h-5 text-[var(--color-gold)] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">三吉门方位（开·休·生）</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {g.luckyGates.map((h) => (
                <span key={h.gong} className="font-medium">
                  <span style={{ color: wuxingColor(h.gate) }}>{h.gate}</span>
                  <span className="text-[var(--color-gold)]"> {h.direction}</span>
                  <span className="text-muted-foreground text-xs">（{h.gong}宫）</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 凶门提醒 */}
      {g.uncertainGates.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
          <ShieldAlert className="w-5 h-5 text-red-400/80 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">三凶门所在（死·惊·伤），谋事慎用</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {g.uncertainGates.map((h) => (
                <span key={h.gong} className="font-medium">
                  <span style={{ color: wuxingColor(h.gate) }}>{h.gate}</span>
                  <span className="text-foreground/80"> {h.direction}</span>
                  <span className="text-muted-foreground text-xs">（{h.gong}宫）</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 格局统计 */}
      {(g.jiPatternCount > 0 || g.xiongPatternCount > 0) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          本盘识别格局：
          {g.jiPatternCount > 0 && <span className="text-green-400">吉格 {g.jiPatternCount}</span>}
          {g.jiPatternCount > 0 && g.xiongPatternCount > 0 && ' · '}
          {g.xiongPatternCount > 0 && <span className="text-red-400">凶格 {g.xiongPatternCount}</span>}
          <span className="text-xs">（详见格局面板）</span>
        </div>
      )}

      {/* 要点列表 */}
      <div className="space-y-2">
        {g.notes.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
            <p className="leading-relaxed">{s}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60 border-t border-border/30 pt-2">
        以上为按公认口径（三吉三凶门、值符值使、马空刑迫墓）自动提取的用盘提纲，完整断验请结合格局与 AI 分析。
      </p>
    </div>
  );
}
