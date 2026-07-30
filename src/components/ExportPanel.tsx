import { useMemo, useState } from 'react';
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

/** 预估文件大小（UTF-8 字节数，与下载落盘一致） */
function formatSize(text: string): string {
  const kb = new TextEncoder().encode(text).length / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
}

export function ExportPanel({ chart, engine, solar, extra }: Props) {
  const [copied, setCopied] = useState<CopyKind | null>(null);

  const md = useMemo(() => chartToMarkdown(chart, engine, solar, extra), [chart, engine, solar, extra]);
  const toon = useMemo(() => chartToToon(chart, engine, solar, extra), [chart, engine, solar, extra]);
  const mdSize = useMemo(() => formatSize(md), [md]);
  const toonSize = useMemo(() => formatSize(toon), [toon]);

  const promptInquiry = extra.inquiry
    ? { topicLabel: getTopic(extra.inquiry.topicId).label, subject: extra.inquiry.subject }
    : undefined;

  const doCopy = async (kind: CopyKind) => {
    const text = kind === 'md' ? md : kind === 'toon' ? toon : generateQimenPrompt(md, promptInquiry);
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
    'flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer';
  const btnPlain = 'bg-secondary/70 hover:bg-secondary border border-border/40 text-muted-foreground hover:text-foreground';

  return (
    <div className="space-y-3">
      {/* 移动端徽标与说明各占一行，避免徽标被挤成两行；sm 起恢复单行 */}
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
          <Sparkles className="w-3 h-3" />
          已准备好喂 AI
        </div>
        <span className="text-[11px] text-muted-foreground">
          盘面 + 用神定位 + 预计算生克 + 占法古法{extra.refs?.length ? ` + 典籍参考 ${extra.refs.length} 条` : ''}，可按六步法直接推理
        </span>
      </div>

      {/* 数据文件下载 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => doDownload(toon, 'toon', 'text/plain')}
          className={cn(btnBase, btnPlain)}
          title="TOON（Token-Oriented Object Notation）：与 JSON 同构、喂 LLM 更省 token 的结构化格式"
        >
          <Download className="w-4 h-4" />
          导出 TOON 文件（{toonSize}）
        </button>
        <button onClick={() => doDownload(md, 'md', 'text/markdown')} className={cn(btnBase, btnPlain)}>
          <Download className="w-4 h-4" />
          导出 Markdown 文件（{mdSize}）
        </button>
      </div>

      {/* 复制原始数据 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button onClick={() => doCopy('md')} className={cn(btnBase, btnPlain, copied === 'md' && 'text-green-400 border-green-500/40')}>
          {copied === 'md' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === 'md' ? '已复制' : '复制 Markdown'}
        </button>
        <button
          onClick={() => doCopy('toon')}
          className={cn(btnBase, btnPlain, copied === 'toon' && 'text-green-400 border-green-500/40')}
          title="TOON（Token-Oriented Object Notation）：与 JSON 同构、喂 LLM 更省 token 的结构化格式"
        >
          {copied === 'toon' ? <Check className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
          {copied === 'toon' ? '已复制' : '复制 TOON'}
        </button>
      </div>

      {/* 一键喂 AI */}
      <button
        onClick={() => doCopy('prompt')}
        className={cn(
          btnBase,
          'w-full h-10',
          'bg-[var(--color-gold)]/90 hover:bg-[var(--color-gold)] text-black font-semibold shadow-md shadow-amber-900/20',
          copied === 'prompt' && 'bg-green-500 hover:bg-green-500 text-white',
        )}
      >
        {copied === 'prompt' ? <Check className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        {copied === 'prompt' ? '已复制，粘贴给 ChatGPT / Claude 即可' : '复制 AI Prompt（六步断盘 · 含完整盘面）'}
      </button>

      {/* MD 预览 */}
      <div className="rounded-lg bg-secondary/30 border border-border/30 p-3 max-h-40 overflow-y-auto">
        <pre className="text-[10px] text-muted-foreground/70 whitespace-pre-wrap break-all font-mono leading-relaxed select-all">
          {md.slice(0, 1600)}{md.length > 1600 ? '\n…' : ''}
        </pre>
      </div>
    </div>
  );
}
