/**
 * P3 组件 SSR 冒烟：renderToString 真渲染（无 DOM），守住 props/JSX 运行时路径。
 * 交互行为由 utils 层单测覆盖（archive.test / cross-check diffCharts）。
 */
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getQimenEngine } from '@/engines/registry';
import { makeArchiveEntry } from '@/utils/archive';
import { defaultSolarTimeSetting } from '@/utils/true-solar-time';
import { ArchivePanel } from '../ArchivePanel';
import { CompareView } from '../CompareView';
import { NinePalaceGrid } from '../NinePalaceGrid';

const date = new Date(2024, 5, 15, 14, 30);
const chart = getQimenEngine('sanmeta').compute({ date, method: '拆补' });

describe('P3 组件渲染冒烟', () => {
  it('ArchivePanel：空态出存入按钮，有条目出摘要与载入/删除', () => {
    const noop = () => {};
    const empty = renderToString(<ArchivePanel entries={[]} onSave={noop} onLoad={noop} onDelete={noop} />);
    expect(empty).toContain('存入历史');
    const entry = makeArchiveEntry(
      {
        dateStr: '2024-06-15T14:30', layer: '时家', engineId: 'sanmeta', method: '拆补',
        solarSetting: defaultSolarTimeSetting(), topicId: '求财', subject: '合作', birthYear: '',
      },
      chart,
    );
    const withOne = renderToString(<ArchivePanel entries={[entry]} onSave={noop} onLoad={noop} onDelete={noop} />);
    expect(withOne).toContain('阳遁6局');
    expect(withOne).toContain('值符天柱');
    expect(withOne).toContain('载入');
    expect(withOne).toContain('三元 3meta');
  });

  it('CompareView：初始渲染出对照引擎选择器，候选不含当前引擎', () => {
    const html = renderToString(<CompareView chart={chart} date={date} />);
    expect(html).toContain('对照引擎');
    expect(html).toContain('关闭对照');
    expect(html).toContain('鲲侯 BigFishMarquis');
    expect(html).not.toContain('>三元 3meta（'); // 当前引擎不在候选
  });

  it('NinePalaceGrid：高亮宫带琥珀描边类，非高亮不带', () => {
    const html = renderToString(<NinePalaceGrid chart={chart} highlightGongs={new Set([1, 9] as const)} />);
    expect((html.match(/ring-amber-500\/70/g) ?? []).length).toBe(2);
    const plain = renderToString(<NinePalaceGrid chart={chart} />);
    expect(plain).not.toContain('ring-amber-500/70');
  });
});
