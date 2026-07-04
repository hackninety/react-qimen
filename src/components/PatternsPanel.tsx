import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PatternHit } from '@/engines/types';
import { cn } from '@/utils/cn';

const KIND_STYLE: Record<string, string> = {
  吉: 'bg-emerald-500/15 text-emerald-300',
  凶: 'bg-red-500/15 text-red-300',
  中: 'bg-zinc-500/15 text-zinc-300',
};

function PatternItem({ p }: { p: PatternHit }) {
  const [open, setOpen] = useState(false);
  const hasNote = Boolean(p.note);
  return (
    <li className="rounded border border-border/60 bg-secondary/40">
      <button
        className={cn('flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm', hasNote && 'cursor-pointer')}
        onClick={() => hasNote && setOpen(!open)}
      >
        {p.kind && <span className={cn('rounded px-1 text-[10px] leading-4 shrink-0', KIND_STYLE[p.kind])}>{p.kind}</span>}
        <span className="flex-1">{p.name}</span>
        {p.gong && <span className="text-[10px] text-muted-foreground shrink-0">{p.gong}宫</span>}
        {hasNote && <ChevronDown size={12} className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />}
      </button>
      {open && p.note && (
        <p className="whitespace-pre-wrap border-t border-border/60 px-2 py-1.5 text-xs leading-5 text-muted-foreground">{p.note}</p>
      )}
    </li>
  );
}

export function PatternsPanel({ patterns }: { patterns: PatternHit[] }) {
  if (!patterns.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h2 className="pb-2 text-sm font-semibold text-[var(--color-gold-light)]">格局（{patterns.length}）</h2>
      <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {patterns.map((p, i) => (
          <PatternItem key={`${p.name}-${p.gong}-${i}`} p={p} />
        ))}
      </ul>
    </div>
  );
}
