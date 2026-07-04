import type { PalaceInfo, PalaceMark } from '@/engines/types';
import { GONG_TRIGRAMS, GONG_DIRECTIONS } from '@/engines/types';
import { ganColor, gateColor, starColor } from '@/utils/wuxing';
import { cn } from '@/utils/cn';

const MARK_STYLE: Record<PalaceMark, string> = {
  空亡: 'bg-zinc-500/20 text-zinc-300',
  马星: 'bg-amber-500/20 text-amber-300',
  击刑: 'bg-red-500/25 text-red-300',
  门迫: 'bg-orange-500/25 text-orange-300',
  入墓: 'bg-purple-500/25 text-purple-300',
};

interface Props {
  palace: PalaceInfo;
  isZhiFu: boolean;
  isZhiShi: boolean;
}

function GanList({ gans }: { gans: string[] }) {
  return (
    <span className="flex gap-0.5">
      {gans.map((g, i) => (
        <span key={i} className="text-lg font-bold leading-none" style={{ color: ganColor(g) }}>
          {g}
        </span>
      ))}
    </span>
  );
}

export function PalaceCell({ palace: p, isZhiFu, isZhiShi }: Props) {
  const isCenter = p.gong === 5;
  const empty = !p.star && !p.gate && !p.god;

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-md border border-border bg-card p-2 min-h-32 transition-colors',
        (isZhiFu || isZhiShi) && 'border-[var(--color-gold)]/50 shadow-[0_0_12px_-4px_var(--color-gold)]',
      )}
    >
      {/* 顶行：八神 + 标记 */}
      <div className="flex items-start justify-between gap-1">
        <span className="text-sm font-semibold text-[var(--color-gold-light)] leading-none">{p.god ?? ''}</span>
        <span className="flex flex-wrap justify-end gap-0.5">
          {isZhiFu && <i className="not-italic rounded px-1 text-[10px] leading-4 bg-[var(--color-gold)]/25 text-[var(--color-gold-light)]">符</i>}
          {isZhiShi && <i className="not-italic rounded px-1 text-[10px] leading-4 bg-[var(--color-gold)]/25 text-[var(--color-gold-light)]">使</i>}
          {p.marks.map((m) => (
            <i key={m} className={cn('not-italic rounded px-1 text-[10px] leading-4', MARK_STYLE[m])}>{m}</i>
          ))}
        </span>
      </div>

      {/* 中行：九星 · 天盘干 */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm leading-none" style={{ color: p.star ? starColor(p.star) : undefined }}>
          {p.star ?? ''}
          {p.extras?.['星'] && <em className="ml-0.5 not-italic text-[10px] text-muted-foreground">{p.extras['星']}</em>}
        </span>
        <GanList gans={p.tianPanGan} />
      </div>

      {/* 底行：八门 · 地盘干 */}
      <div className="flex items-end justify-between gap-1">
        <span className="text-sm leading-none" style={{ color: p.gate ? gateColor(p.gate) : undefined }}>
          {p.gate ?? ''}
          {p.extras?.['门'] && <em className="ml-0.5 not-italic text-[10px] text-muted-foreground">{p.extras['门']}</em>}
        </span>
        <GanList gans={p.diPanGan} />
      </div>

      {/* 角标：宫名 + 暗干 + 引擎特有字段 */}
      <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-1 text-[10px] text-muted-foreground">
        <span>
          {GONG_TRIGRAMS[p.gong]}{p.gong} · {GONG_DIRECTIONS[p.gong]}
        </span>
        <span className="flex gap-1">
          {p.hiddenGan && <span>暗{p.hiddenGan}</span>}
          {p.extras &&
            Object.entries(p.extras)
              .filter(([k]) => !['星', '门'].includes(k))
              .slice(0, 3)
              .map(([k, v]) => (
                <span key={k} title={`${k}：${v}`}>
                  {k === '地神' ? `地·${v}` : k === '旺衰' ? v : `${k}${v.length > 4 ? v.slice(0, 4) + '…' : v}`}
                </span>
              ))}
        </span>
      </div>

      {isCenter && empty && p.diPanGan.length === 0 && (
        <span className="absolute inset-0 grid place-items-center text-muted-foreground/50 text-sm pointer-events-none">中宫</span>
      )}
    </div>
  );
}
