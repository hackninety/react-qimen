import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { QimenEngine, UnifiedQimenChart } from '@/engines/types';
import { ganColor } from '@/utils/wuxing';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}

function GanZhi({ gz }: { gz: string }) {
  return (
    <span className="font-semibold">
      <span style={{ color: ganColor(gz[0]) }}>{gz[0]}</span>
      <span>{gz.slice(1)}</span>
    </span>
  );
}

export function MetaPanel({ chart, engine }: { chart: UnifiedQimenChart; engine: QimenEngine }) {
  const [copied, setCopied] = useState(false);
  const m = chart.meta;

  const copyJson = async () => {
    const exportable = { ...chart, raw: undefined };
    await navigator.clipboard.writeText(JSON.stringify(exportable, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold text-[var(--color-gold-light)]">盘面信息</h2>
        <button
          onClick={copyJson}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="复制统一盘面 JSON（可直接投喂 AI 解读）"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '已复制' : 'JSON'}
        </button>
      </div>

      <Row label="四柱">
        <span className="flex gap-2">
          <GanZhi gz={m.siZhu.year} />
          <GanZhi gz={m.siZhu.month} />
          <GanZhi gz={m.siZhu.day} />
          <GanZhi gz={m.siZhu.hour} />
        </span>
      </Row>
      <Row label="局数">
        <span className="font-semibold text-[var(--color-gold-light)]">
          {m.jieQi} · {m.dun}{m.ju}局{m.yuan ? ` · ${m.yuan}` : ''}
        </span>
      </Row>
      <Row label="值符 / 值使">
        {m.zhiFu ?? '—'}{m.zhiFuGong ? `（${m.zhiFuGong}宫）` : ''} / {m.zhiShi ?? '—'}{m.zhiShiGong ? `（${m.zhiShiGong}宫）` : ''}
      </Row>
      <Row label="旬首">
        {m.xunShou ?? '—'}{m.fuShou ? `（遁${m.fuShou}）` : ''}
      </Row>
      <Row label="空亡 / 马星">
        {(m.kongWang?.join('') || '—') + ' / ' + (m.maXing || '—')}
      </Row>
      <Row label="时间">
        <span className="text-xs text-muted-foreground">{m.solarText}{m.lunarText ? ` · ${m.lunarText}` : ''}</span>
      </Row>

      <div className="pt-2 text-[11px] leading-5 text-muted-foreground">
        <div className="flex items-center gap-1 flex-wrap">
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
        </div>
        <p className="mt-1">{engine.notes}</p>
      </div>
    </div>
  );
}
