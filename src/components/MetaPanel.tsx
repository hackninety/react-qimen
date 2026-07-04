import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { QimenEngine, UnifiedQimenChart } from '@/engines/types';
import type { SolarTimeResult } from '@/utils/true-solar-time';
import { formatOffset } from '@/utils/true-solar-time';
import { chartToJson, chartToMarkdown } from '@/utils/export';
import { copyText } from '@/utils/clipboard';
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

interface Props {
  chart: UnifiedQimenChart;
  engine: QimenEngine;
  solar: SolarTimeResult;
}

function CopyBtn({ kind, copied, title, onCopy }: { kind: 'md' | 'json'; copied: boolean; title: string; onCopy(kind: 'md' | 'json'): void }) {
  return (
    <button
      onClick={() => onCopy(kind)}
      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      title={title}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? '已复制' : kind.toUpperCase()}
    </button>
  );
}

export function MetaPanel({ chart, engine, solar }: Props) {
  const [copied, setCopied] = useState<'md' | 'json' | null>(null);
  const m = chart.meta;

  const copy = async (kind: 'md' | 'json') => {
    const text = kind === 'md' ? chartToMarkdown(chart, engine, solar) : chartToJson(chart, engine, solar);
    if (await copyText(text)) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold text-[var(--color-gold-light)]">盘面信息</h2>
        <div className="flex gap-1">
          <CopyBtn kind="md" copied={copied === 'md'} onCopy={copy} title="复制 Markdown（紧凑，省 token，适合投喂 AI）" />
          <CopyBtn kind="json" copied={copied === 'json'} onCopy={copy} title="复制 JSON（完整结构，含格局断语与地理上下文）" />
        </div>
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
      {solar.applied && (
        <Row label="真太阳时">
          <span className="text-xs">
            {solar.place} · 修正 {formatOffset(solar.offsetMinutes ?? 0)}
            <em className="ml-1 not-italic text-muted-foreground">（经度 {formatOffset(solar.longitudeCorrectionMinutes ?? 0)}，均时差 {formatOffset(solar.eotMinutes ?? 0)}）</em>
          </span>
        </Row>
      )}
      <Row label="时间">
        <span className="text-xs text-muted-foreground">{m.solarText}{m.lunarText ? ` · ${m.lunarText}` : ''}</span>
      </Row>
    </div>
  );
}
