import type { PalaceInfo } from '@/engines/types';
import { GONG_TRIGRAMS } from '@/engines/types';
import { PALACE_BRANCHES } from '@/engines/calendar';
import { gateJiXiong } from '@/lib/reference';
import { wuxingColor } from '@/utils/wuxing';
import { cn } from '@/utils/cn';

interface Props {
  palace: PalaceInfo;
  isZhiFu: boolean;
  isZhiShi: boolean;
  /** 符首（甲所遁六仪），天盘干命中时加框标识值符所在 */
  fuShou?: string;
}

/** 吉凶竖条颜色（按八门三吉三凶） */
const JIXIONG_BAR: Record<string, string> = {
  ji: 'bg-green-500/80',
  ping: 'bg-muted-foreground/30',
  xiong: 'bg-red-500/70',
};

/** 天干列（天/地盘），多干竖排 */
function GanColumn({ gans, ring }: { gans: string[]; ring?: string }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      {gans.length ? (
        gans.map((g, i) => (
          <span
            key={i}
            className={cn(
              'text-xl md:text-2xl font-bold font-serif leading-none',
              ring && g === ring && 'ring-1 ring-current px-0.5 rounded-sm',
            )}
            style={{ color: wuxingColor(g) }}
          >
            {g}
          </span>
        ))
      ) : (
        <span className="text-xl md:text-2xl leading-none">&nbsp;</span>
      )}
    </div>
  );
}

export function PalaceCell({ palace: p, isZhiFu, isZhiShi, fuShou }: Props) {
  const jx = gateJiXiong(p.gate);
  const branches = PALACE_BRANCHES[p.gong]?.join('') ?? '';
  const hasMa = p.marks.includes('马星');
  const hasKong = p.marks.includes('空亡');
  const miniMarks = p.marks.filter((m) => m !== '马星' && m !== '空亡');
  const wangShuaiXing = p.extras?.['星'];
  const wangShuaiMen = p.extras?.['门'];
  const extraEntries = Object.entries(p.extras ?? {}).filter(([k]) => !['星', '门'].includes(k));

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-2.5 md:p-3 min-h-[132px]',
        'bg-card/60 backdrop-blur-sm transition-all duration-200',
        'hover:bg-card/80',
        p.gong === 5 && 'bg-card/30',
      )}
    >
      {/* 吉凶竖条指示器 */}
      <div className={cn('absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full', jx ? JIXIONG_BAR[jx] : 'bg-transparent')} />

      {/* 值符/值使标记 */}
      {(isZhiFu || isZhiShi) && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
          {isZhiFu && (
            <span className="text-[9px] bg-[var(--color-gold)] text-black px-1 py-px rounded-b font-medium leading-tight">符</span>
          )}
          {isZhiShi && (
            <span className="text-[9px] bg-blue-500 text-white px-1 py-px rounded-b font-medium leading-tight">使</span>
          )}
        </div>
      )}

      {/* 背景水印宫数 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-7xl md:text-8xl font-black font-serif text-foreground/[0.04] select-none">{p.gong}</span>
      </div>

      {/* 上行：暗干 | 八神 | 马·空徽章 */}
      <div className="flex items-start justify-between text-xs relative z-10">
        <span className="text-muted-foreground font-serif" title={p.hiddenGan ? `暗干 ${p.hiddenGan}` : undefined}>
          {p.hiddenGan || ' '}
        </span>
        <span className="font-medium" style={{ color: wuxingColor(p.god) }}>
          {p.god || ' '}
        </span>
        <div className="flex gap-0.5 shrink-0">
          {hasMa && (
            <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 border border-green-500/50 flex items-center justify-center text-[9px] font-bold">马</span>
          )}
          {hasKong && (
            <span className="w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 flex items-center justify-center text-[9px] font-bold">空</span>
          )}
          {!hasMa && !hasKong && <span className="w-4 h-4" />}
        </div>
      </div>

      {/* 中部：门+星 居中；天盘干 右上 */}
      <div className="flex-1 flex items-center justify-center relative z-10 my-1">
        <div className="absolute top-0 right-0">
          <GanColumn gans={p.tianPanGan} ring={fuShou} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg md:text-xl font-bold font-serif leading-none" style={{ color: wuxingColor(p.gate) }}>
            {p.gate || ' '}
            {wangShuaiMen && <em className="ml-0.5 not-italic align-super text-[9px] text-muted-foreground">{wangShuaiMen}</em>}
          </span>
          <span className="text-sm md:text-base font-semibold leading-none" style={{ color: wuxingColor(p.star) }}>
            {p.star || ' '}
            {wangShuaiXing && <em className="ml-0.5 not-italic align-super text-[9px] text-muted-foreground">{wangShuaiXing}</em>}
          </span>
        </div>
      </div>

      {/* 下行：宫名·辖支 + 刑迫墓 | 地盘干 */}
      <div className="flex items-end justify-between relative z-10">
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            {miniMarks.map((m) => (
              <span key={m} className="text-[9px] leading-4 px-1 rounded bg-red-500/15 text-red-300/90">{m}</span>
            ))}
            {extraEntries.slice(0, 2).map(([k, v]) => (
              <span key={k} className="text-[9px] leading-4 px-1 rounded bg-secondary/80 text-muted-foreground" title={`${k}：${v}`}>
                {k === '地神' ? `地${v}` : v.length > 3 ? `${v.slice(0, 3)}…` : v}
              </span>
            ))}
          </div>
          <span className="text-xs font-serif font-medium" style={{ color: wuxingColor(GONG_TRIGRAMS[p.gong]) }}>
            {GONG_TRIGRAMS[p.gong]}{p.gong}
            <span className="ml-1 text-[9px] text-muted-foreground/70">{branches}</span>
          </span>
        </div>
        <GanColumn gans={p.diPanGan} />
      </div>
    </div>
  );
}
