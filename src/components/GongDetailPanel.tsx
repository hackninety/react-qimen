import type { UnifiedQimenChart } from '@/engines/types';
import { GONG_NAMES, GONG_DIRECTIONS, LUOSHU_GRID } from '@/engines/types';
import { gateInfo, gateJiXiong, godInfo, JIXIONG_LABEL, starInfo } from '@/lib/reference';
import { wuxingColor } from '@/utils/wuxing';
import { cn } from '@/utils/cn';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground w-8 shrink-0">{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}

export function GongDetailPanel({ chart }: { chart: UnifiedQimenChart }) {
  return (
    <div className="space-y-2">
      <p className="hidden md:block text-[11px] text-muted-foreground/60">
        卡片位置对应实际方位 · 上南下北 · 左东右西（与九宫盘一致）
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {LUOSHU_GRID.flat().map((gong) => {
          const p = chart.palaces[gong - 1];
        const jx = gateJiXiong(p.gate);
        const star = starInfo(p.star);
        const gateMeaning = gateInfo(p.gate);
        const godMeaning = godInfo(p.god);
        const gongPatterns = chart.patterns?.filter((pt) => pt.gong === p.gong) ?? [];
        const extras = Object.entries(p.extras ?? {}).filter(([k]) => !['星', '门'].includes(k));

        return (
          <div key={p.gong} className="glass-card rounded-xl overflow-hidden border border-border/40">
            {/* 宫位标题 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/30">
              <span className="text-sm font-semibold font-serif text-foreground">
                {GONG_NAMES[p.gong]} · {GONG_DIRECTIONS[p.gong]}
              </span>
              {jx && (
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    jx === 'ji' && 'bg-green-500/15 text-green-400',
                    jx === 'ping' && 'bg-muted-foreground/15 text-muted-foreground',
                    jx === 'xiong' && 'bg-red-500/15 text-red-400',
                  )}
                >
                  门{JIXIONG_LABEL[jx]}
                </span>
              )}
            </div>

            {/* 宫位内容 */}
            <div className="px-3 py-2.5 space-y-1.5 text-xs">
              {p.god && (
                <DetailRow label="八神">
                  <span style={{ color: wuxingColor(p.god) }}>{p.god}</span>
                  {p.extras?.['地神'] && <span className="text-muted-foreground ml-1.5">地盘 {p.extras['地神']}</span>}
                </DetailRow>
              )}
              {p.star && (
                <DetailRow label="九星">
                  <span style={{ color: wuxingColor(p.star) }}>{p.star}</span>
                  {star.alias && <span className="text-muted-foreground ml-1">({star.alias})</span>}
                  {p.extras?.['星'] && <span className="text-muted-foreground ml-1">· {p.extras['星']}</span>}
                </DetailRow>
              )}
              {p.gate && (
                <DetailRow label="八门">
                  <span style={{ color: wuxingColor(p.gate) }}>{p.gate}</span>
                  {p.extras?.['门'] && <span className="text-muted-foreground ml-1">· {p.extras['门']}</span>}
                </DetailRow>
              )}
              <DetailRow label="天盘">
                <span className="font-serif font-bold">
                  {p.tianPanGan.map((g, i) => (
                    <span key={i} style={{ color: wuxingColor(g) }}>{g}</span>
                  ))}
                </span>
                <span className="text-muted-foreground mx-1.5">/</span>
                <span className="text-muted-foreground">地盘</span>
                <span className="font-serif font-bold ml-1.5">
                  {p.diPanGan.map((g, i) => (
                    <span key={i} style={{ color: wuxingColor(g) }}>{g}</span>
                  ))}
                </span>
                {p.hiddenGan && <span className="text-muted-foreground ml-1.5">暗 {p.hiddenGan}</span>}
              </DetailRow>
              {(p.marks.length > 0 || extras.length > 0) && (
                <DetailRow label="标记">
                  <span className="flex flex-wrap gap-1">
                    {p.marks.map((m) => (
                      <span key={m} className="px-1 rounded bg-red-500/10 text-red-300/90">{m}</span>
                    ))}
                    {extras.map(([k, v]) => (
                      <span key={k} className="px-1 rounded bg-secondary text-muted-foreground" title={`${k}：${v}`}>
                        {k}:{v.length > 6 ? `${v.slice(0, 6)}…` : v}
                      </span>
                    ))}
                  </span>
                </DetailRow>
              )}
              {gongPatterns.length > 0 && (
                <DetailRow label="格局">
                  <span className="flex flex-wrap gap-1">
                    {gongPatterns.map((pt, i) => (
                      <span
                        key={i}
                        className={cn(
                          'px-1 rounded',
                          pt.kind === '吉' && 'bg-green-500/10 text-green-400',
                          pt.kind === '凶' && 'bg-red-500/10 text-red-400',
                          !pt.kind && 'bg-secondary text-muted-foreground',
                        )}
                        title={pt.note}
                      >
                        {pt.name}
                      </span>
                    ))}
                  </span>
                </DetailRow>
              )}
              {(star.meaning || gateMeaning || godMeaning) && (
                <div className="text-muted-foreground/80 pt-1.5 border-t border-border/20 leading-relaxed space-y-0.5">
                  {star.meaning && <p>星：{star.meaning}</p>}
                  {gateMeaning && <p>门：{gateMeaning}</p>}
                  {godMeaning && <p>神：{godMeaning}</p>}
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
