/**
 * 占类 → 古法原文（qmdj-ts-lib/zhanmu 动态加载，不进首屏包）：
 * 分类论断（卷十一~十四该占类全套）+ 相关具体占目（卷七~十按关键词，上限 6 条）。
 */
import { useEffect, useState } from 'react';
import type { LunDuanEntry, ZhanMuEntry } from 'qmdj-ts-lib/zhanmu';
import { getTopic } from '@/lib/yongshen-rules';

export type { LunDuanEntry, ZhanMuEntry } from 'qmdj-ts-lib/zhanmu';

export interface ZhanFa {
  topicId: string;
  lunDuan: LunDuanEntry[];
  zhanMu: ZhanMuEntry[];
}

/** 综合占类无专属古法，模块级常量直接返回（不经异步 effect） */
const EMPTY_ZHANFA: ZhanFa = { topicId: '综合', lunDuan: [], zhanMu: [] };

export function useZhanFa(topicId: string): ZhanFa | null {
  const [state, setState] = useState<ZhanFa | null>(null);
  const topic = getTopic(topicId);

  useEffect(() => {
    if (topic.id === '综合') return;
    let live = true;
    import('qmdj-ts-lib/zhanmu')
      .then((z) => {
        if (!live) return;
        setState({
          topicId: topic.id,
          lunDuan: z.getLunDuan(topic.id),
          zhanMu: z.searchZhanMu(topic.keywords).slice(0, 6),
        });
      })
      .catch(() => {
        if (live) setState({ topicId: topic.id, lunDuan: [], zhanMu: [] });
      });
    return () => {
      live = false;
    };
  }, [topic]);

  if (topic.id === '综合') return EMPTY_ZHANFA;
  return state?.topicId === topic.id ? state : null;
}
