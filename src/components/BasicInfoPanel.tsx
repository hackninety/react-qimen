import type { QimenEngine, UnifiedQimenChart } from '@/engines/types';
import type { SolarTimeResult } from '@/utils/true-solar-time';
import { formatOffset } from '@/utils/true-solar-time';
import { wuxingColor } from '@/utils/wuxing';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground font-medium text-right">{children}</span>
    </div>
  );
}

const fmtDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Props {
  chart: UnifiedQimenChart;
  engine: QimenEngine;
  solar: SolarTimeResult;
}

export function BasicInfoPanel({ chart, engine, solar }: Props) {
  const m = chart.meta;
  const pillars = [
    { label: '年柱', value: m.siZhu.year },
    { label: '月柱', value: m.siZhu.month },
    { label: '日柱', value: m.siZhu.day },
    { label: '时柱', value: m.siZhu.hour },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 日期信息 */}
      <div className="space-y-1.5 text-sm">
        <Row label="公历">{fmtDate(solar.standardDate)}</Row>
        {m.lunarText && <Row label="农历">{m.lunarText}</Row>}
        {solar.applied ? (
          <>
            <Row label="地点">{solar.place}</Row>
            <Row label="真太阳时">{fmtDate(solar.date)}</Row>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">校准</span>
              <span className="text-xs text-[var(--color-gold)]">
                E{solar.longitude?.toFixed(2)}° · {formatOffset(solar.offsetMinutes ?? 0)}
                <em className="not-italic text-muted-foreground">（经度 {formatOffset(solar.longitudeCorrectionMinutes ?? 0)} + 均时差 {formatOffset(solar.eotMinutes ?? 0)}）</em>
              </span>
            </div>
          </>
        ) : (
          <Row label="口径">
            <span className="text-xs text-muted-foreground">钟表时间（未启用真太阳时）</span>
          </Row>
        )}
        <Row label="节气">{m.jieQi}</Row>
      </div>

      {/* 四柱卡片 */}
      <div className="grid grid-cols-4 gap-1.5 content-center">
        {pillars.map((p) => {
          const gan = p.value?.charAt(0) || '';
          const zhi = p.value?.charAt(1) || '';
          return (
            <div key={p.label} className="flex flex-col items-center rounded-lg bg-secondary/50 border border-border/30 py-2 px-1">
              <span className="text-[10px] text-muted-foreground mb-1">{p.label}</span>
              <span className="text-lg font-bold font-serif leading-none" style={{ color: wuxingColor(gan) }}>{gan}</span>
              <div className="w-3 h-px bg-border/50 my-1" />
              <span className="text-lg font-bold font-serif leading-none" style={{ color: wuxingColor(zhi) }}>{zhi}</span>
            </div>
          );
        })}
      </div>

      {/* 局数信息 */}
      <div className="space-y-1.5 text-sm">
        <Row label="局数">
          <span className="text-[var(--color-gold)] font-semibold">
            {m.dun}{m.ju}局{m.yuan ? ` · ${m.yuan}` : ''}
          </span>
        </Row>
        <Row label="旬首">
          <span className="font-serif">{m.xunShou ?? '—'}{m.fuShou ? `（遁${m.fuShou}）` : ''}</span>
        </Row>
        <Row label="值符">
          {m.zhiFu ?? '—'}
          {m.zhiFuGong && <span className="text-muted-foreground text-xs ml-1">({m.zhiFuGong}宫)</span>}
        </Row>
        <Row label="值使">
          {m.zhiShi ?? '—'}
          {m.zhiShiGong && <span className="text-muted-foreground text-xs ml-1">({m.zhiShiGong}宫)</span>}
        </Row>
        <Row label="空亡 / 马星">
          <span className="font-serif">{m.kongWang?.join('') || '—'} / {m.maXing || '—'}</span>
        </Row>
        <div className="flex justify-between items-center pt-1">
          <span className="text-muted-foreground text-xs">口径</span>
          <span className="flex gap-1 text-[10px]">
            <span className="rounded bg-secondary px-1.5 py-0.5">{chart.school}</span>
            <span className="rounded bg-secondary px-1.5 py-0.5">{chart.method}法</span>
            <span className="rounded bg-[var(--color-gold)]/15 text-[var(--color-gold)] px-1.5 py-0.5">{engine.name}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
