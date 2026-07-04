import { useState } from 'react';
import { Bot, Check, Copy, Download, FileJson, Sparkles } from 'lucide-react';
import type { QimenEngine, UnifiedQimenChart } from '@/engines/types';
import type { SolarTimeResult } from '@/utils/true-solar-time';
import { chartToJson, chartToMarkdown } from '@/utils/export';
import { generateQimenPrompt } from '@/utils/prompt-template';
import { copyText } from '@/utils/clipboard';
import { cn } from '@/utils/cn';

interface Props {
  chart: UnifiedQimenChart;
  engine: QimenEngine;
  solar: SolarTimeResult;
}

type CopyKind = 'md' | 'json' | 'prompt';

export function ExportPanel({ chart, engine, solar }: Props) {
  const [copied, setCopied] = useState<CopyKind | null>(null);

  const md = chartToMarkdown(chart, engine, solar);

  const doCopy = async (kind: CopyKind) => {
    const text = kind === 'md' ? md : kind === 'json' ? chartToJson(chart, engine, solar) : generateQimenPrompt(md);
    if (await copyText(text)) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const doDownload = () => {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = solar.date;
    const pad = (n: number) => String(n).padStart(2, '0');
    a.href = url;
    a.download = `qimen_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const btnBase =
    'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer';
  const btnPlain = 'bg-secondary/70 hover:bg-secondary border border-border/40 text-muted-foreground hover:text-foreground';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
        <Sparkles className="w-3 h-3" />
        已附排盘口径与地理/时间上下文，可直接喂 AI（MD 比 JSON 更省 token）
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={doDownload} className={cn(btnBase, btnPlain)}>
          <Download className="w-3.5 h-3.5" />
          下载 MD
        </button>
        <button onClick={() => doCopy('md')} className={cn(btnBase, btnPlain, copied === 'md' && 'text-green-400 border-green-500/40')}>
          {copied === 'md' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === 'md' ? '已复制' : '复制 MD'}
        </button>
        <button onClick={() => doCopy('json')} className={cn(btnBase, btnPlain, copied === 'json' && 'text-green-400 border-green-500/40')}>
          {copied === 'json' ? <Check className="w-3.5 h-3.5" /> : <FileJson className="w-3.5 h-3.5" />}
          {copied === 'json' ? '已复制' : '复制 JSON'}
        </button>
        <button
          onClick={() => doCopy('prompt')}
          className={cn(
            btnBase,
            'bg-[var(--color-gold)]/90 hover:bg-[var(--color-gold)] text-black font-semibold shadow-md shadow-amber-900/20',
            copied === 'prompt' && 'bg-green-500 hover:bg-green-500 text-white',
          )}
        >
          {copied === 'prompt' ? <Check className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
          {copied === 'prompt' ? '已复制' : 'AI Prompt'}
        </button>
      </div>

      {/* MD 预览 */}
      <div className="rounded-lg bg-secondary/30 border border-border/30 p-2.5 max-h-40 overflow-y-auto">
        <pre className="text-[10px] text-muted-foreground/70 whitespace-pre-wrap break-all font-mono leading-relaxed select-all">
          {md.slice(0, 1600)}{md.length > 1600 ? '\n…' : ''}
        </pre>
      </div>
    </div>
  );
}
