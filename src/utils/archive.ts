/**
 * 历史盘存档（纯函数，便于单测）。
 *
 * 只存起局输入参数 + 展示用摘要快照；载入时由引擎按参数重算盘面，
 * 与持久化同一哲学：不缓存派生盘面，避免与引擎版本不一致。
 */
import type { ChartLayer, JuMethod, QimenEngineId, UnifiedQimenChart } from '@/engines/types';
import type { SolarTimeSetting } from './true-solar-time';

export const ARCHIVE_MAX = 50;

export interface ArchiveEntry {
  id: string;
  /** 存档时刻（ISO） */
  savedAt: string;
  // —— 起局输入参数（载入即恢复） ——
  dateStr: string;
  layer: ChartLayer;
  engineId: QimenEngineId;
  method: JuMethod;
  solarSetting: SolarTimeSetting;
  topicId: string;
  subject: string;
  birthYear: string;
  /** 展示摘要快照（局/值符值使/四柱），载入时不采信、仅供列表辨识 */
  summary: string;
}

export interface ArchiveInput {
  dateStr: string;
  layer: ChartLayer;
  engineId: QimenEngineId;
  method: JuMethod;
  solarSetting: SolarTimeSetting;
  topicId: string;
  subject: string;
  birthYear: string;
}

/** 由当前起局参数与盘面生成存档条目 */
export function makeArchiveEntry(input: ArchiveInput, chart: UnifiedQimenChart): ArchiveEntry {
  const m = chart.meta;
  const siZhu = [m.siZhu.year, m.siZhu.month, m.siZhu.day, m.siZhu.hour].filter(Boolean).join(' ');
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    savedAt: new Date().toISOString(),
    ...input,
    summary: `${m.dun}${m.ju}局 值符${m.zhiFu ?? '—'} 值使${m.zhiShi ?? '—'}｜${siZhu}`,
  };
}

/** 头插并按上限截断（最新在前） */
export function insertEntry(list: ArchiveEntry[], entry: ArchiveEntry): ArchiveEntry[] {
  return [entry, ...list].slice(0, ARCHIVE_MAX);
}

export function removeEntry(list: ArchiveEntry[], id: string): ArchiveEntry[] {
  return list.filter((e) => e.id !== id);
}

/** localStorage 校验器：数组且元素带必备字段 */
export function isArchiveList(v: unknown): v is ArchiveEntry[] {
  return (
    Array.isArray(v) &&
    v.every(
      (e) =>
        typeof e === 'object' && e !== null &&
        typeof (e as ArchiveEntry).id === 'string' &&
        typeof (e as ArchiveEntry).dateStr === 'string' &&
        typeof (e as ArchiveEntry).engineId === 'string' &&
        typeof (e as ArchiveEntry).summary === 'string',
    )
  );
}
