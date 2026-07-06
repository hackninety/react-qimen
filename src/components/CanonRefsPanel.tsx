import { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { CanonRef } from '@/hooks/useCanonRefs';
import { cn } from '@/utils/cn';

interface Props {
  refs: CanonRef[] | null;
  /** 打开典籍抽屉并定位到 docPath */
  onOpenDoc(path: string): void;
}

function RefItem({ r, onOpenDoc }: { r: CanonRef; onOpenDoc(path: string): void }) {
  const [open, setOpen] = useState(false);
  const long = r.text.length > 60 || r.text.includes('\n');
  return (
    <li className="rounded border border-border/60 bg-secondary/40">
      <div className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
        <button
          className={cn('flex flex-1 items-center gap-2 text-left min-w-0', long && 'cursor-pointer')}
          onClick={() => long && setOpen(!open)}
        >
          <span className="shrink-0 rounded bg-[var(--color-gold)]/15 px-1 text-[10px] leading-4 text-[var(--color-gold)]">
            {r.kind}
          </span>
          <span className="truncate font-medium">
            {r.key}
            {r.name && r.name !== r.key && <em className="ml-1 not-italic text-muted-foreground">「{r.name}」</em>}
          </span>
          {r.gong && <span className="shrink-0 text-[10px] text-muted-foreground">{r.gong}宫</span>}
          {long && <ChevronDown size={12} className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />}
        </button>
        <button
          onClick={() => onOpenDoc(r.docPath)}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-[var(--color-gold)] transition-colors"
          title="查看典籍原文"
        >
          <BookOpen size={12} />
        </button>
      </div>
      <p
        className={cn(
          'whitespace-pre-wrap px-2 pb-1.5 text-xs leading-5 text-muted-foreground',
          !open && long && 'line-clamp-1',
          !long && 'pt-0',
        )}
      >
        {r.text}
      </p>
    </li>
  );
}

export function CanonRefsPanel({ refs, onOpenDoc }: Props) {
  if (refs === null) return <p className="text-sm text-muted-foreground">检索典籍中…</p>;
  if (!refs.length) return <p className="text-sm text-muted-foreground">本盘暂无直接对应的典籍断语。</p>;
  return (
    <div className="space-y-2">
      <ul className="grid gap-1 md:grid-cols-2 max-h-96 overflow-y-auto pr-1">
        {refs.map((r, i) => (
          <RefItem key={`${r.kind}-${r.key}-${r.gong ?? ''}-${i}`} r={r} onOpenDoc={onOpenDoc} />
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground/60">
        出自《奇門遁甲秘笈大全》（qmdj-ts-lib 深度结构化，按本盘 干/门/星/神/时/格局 自动检索）；点击书页图标查看原文全卷。
      </p>
    </div>
  );
}
