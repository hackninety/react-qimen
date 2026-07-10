import { Archive, Trash2, Upload } from 'lucide-react';
import { getQimenEngine } from '@/engines/registry';
import { ARCHIVE_MAX, type ArchiveEntry } from '@/utils/archive';

interface Props {
  entries: ArchiveEntry[];
  onSave(): void;
  onLoad(e: ArchiveEntry): void;
  onDelete(id: string): void;
}

const fmtSavedAt = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 历史盘存档：只存起局参数，载入即按当前引擎版本重算（不缓存派生盘面） */
export function ArchivePanel({ entries, onSave, onLoad, onDelete }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Archive size={13} className="text-[var(--color-gold)]/80" />
          存入历史
        </button>
        <span className="text-[11px] text-muted-foreground/60">
          {entries.length}/{ARCHIVE_MAX}（存起局参数，载入时按当前引擎重算）
        </span>
      </div>

      {entries.length > 0 && (
        <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-xs"
            >
              <span className="text-muted-foreground/70 tabular-nums">{fmtSavedAt(e.savedAt)}</span>
              <span className="rounded bg-[var(--color-gold)]/15 px-1 text-[10px] leading-4 text-[var(--color-gold)]">
                {e.layer}
              </span>
              <span className="text-muted-foreground">{getQimenEngine(e.engineId).name}</span>
              <span className="min-w-0 flex-1 truncate text-foreground/85" title={e.summary}>
                {e.summary}
                {e.subject && <em className="ml-1 not-italic text-muted-foreground/70">「{e.subject}」</em>}
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onLoad(e)}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-[var(--color-gold)]"
                  title="载入该盘起局参数"
                >
                  <Upload size={12} />
                  载入
                </button>
                <button
                  onClick={() => onDelete(e.id)}
                  className="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-destructive"
                  title="删除该存档"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
