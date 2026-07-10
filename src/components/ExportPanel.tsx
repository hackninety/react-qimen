import { useState } from 'react';
import { Bot, Check, Copy, Download, FileCode2, Sparkles } from 'lucide-react';
import type { QimenEngine, UnifiedQimenChart } from '@/engines/types';
import { getTopic } from '@/lib/yongshen-rules';
import type { SolarTimeResult } from '@/utils/true-solar-time';
import { chartToMarkdown, chartToToon, type ExportExtra } from '@/utils/export';
import { generateQimenPrompt } from '@/utils/prompt-template';
import { copyText } from '@/utils/clipboard';
import { cn } from '@/utils/cn';

interface Props {
  chart: UnifiedQimenChart;
  engine: QimenEngine;
  solar: SolarTimeResult;
  /** 导出附加素材：典籍参考/生克关系/所占用神/占法要旨 */
  extra: ExportExtra;
}

type CopyKind = 'md' | 'toon' | 'prompt';

export function ExportPanel({ chart, engine, solar, extra }: Props) {
  const [copied, setCopied] = useState<CopyKind | null>(null);

  const md = chartToMarkdown(chart, engine, solar, extra);
  const promptInquiry = extra.inquiry
    ? { topicLabel: getTopic(extra.inquiry.topicId).label, subject: extra.inquiry.subject }
    : undefined;

  const doCopy = async (kind: CopyKind) => {
    const text =
      kind === 'md' ? md : kind === 'toon' ? chartToToon(chart, engine, solar, extra) : generateQimenPrompt(md, promptInquiry);
    if (await copyText(text)) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const doDownload = (content: string, ext: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = solar.date;
    const pad = (n: number) => String(n).padStart(2, '0');
    a.href = url;
    a.download = `qimen_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
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
        盘面 + 用神定位 + 预计算生克 + 占法古法{extra.refs?.length ? ` + 典籍参考 ${extra.refs.length} 条` : ''}，AI 可按六步法直接推理
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <button onClick={() => doDownload(md, 'md', 'text/markdown')} className={cn(btnBase, btnPlain)}>
          <Download className="w-3.5 h-3.5" />
          下载 MD
        </button>
        <button
          onClick={() => doDownload(chartToToon(chart, engine, solar, extra), 'toon', 'text/plain')}
          className={cn(btnBase, btnPlain)}
          title="TOON（Token-Oriented Object Notation）：与 JSON 同构、喂 LLM 更省 token 的结构化格式"
        >
          <Download className="w-3.5 h-3.5" />
          下载 TOON
        </button>
        <button onClick={() => doCopy('md')} className={cn(btnBase, btnPlain, copied === 'md' && 'text-green-400 border-green-500/40')}>
          {copied === 'md' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === 'md' ? '已复制' : '复制 MD'}
        </button>
        <button
          onClick={() => doCopy('toon')}
          className={cn(btnBase, btnPlain, copied === 'toon' && 'text-green-400 border-green-500/40')}
          title="TOON（Token-Oriented Object Notation）：与 JSON 同构、喂 LLM 更省 token 的结构化格式"
        >
          {copied === 'toon' ? <Check className="w-3.5 h-3.5" /> : <FileCode2 className="w-3.5 h-3.5" />}
          {copied === 'toon' ? '已复制' : '复制 TOON'}
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
