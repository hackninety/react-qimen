import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../clipboard';
import { createMingliModeGate } from '../mingli-mode';

afterEach(() => vi.unstubAllGlobals());

describe('命例引用复制回退', () => {
  it('剪贴板权限等待期间关闭模式，后续回退复制不附原命例', async () => {
    const gate = createMingliModeGate('当前盘');
    gate.setEnabled(true);
    const ticket = gate.getSnapshot();
    gate.receiveReference(ticket, {
      caseId: 'test', title: '独立案例', text: '不应残留的案例经历',
      sourceUrl: 'https://example.com', sourceRevision: 'rev', collectionId: 'test', mode: 'reference',
    });
    const area = { value: '', style: {}, select: vi.fn(), remove: vi.fn() };
    vi.stubGlobal('document', {
      createElement: () => area,
      body: { appendChild: vi.fn() },
      execCommand: vi.fn(() => true),
    });
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(async () => { gate.setEnabled(false); throw new Error('权限未授予'); }) },
    });
    await expect(copyText(() => gate.appendReference('原盘面', ticket))).resolves.toBe(true);
    expect(area.value).toBe('原盘面');
  });
});
