import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadState, saveState } from '../persist';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemStorage());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('persist 核心', () => {
  it('无值时返回 fallback', () => {
    expect(loadState('k', 'def')).toBe('def');
  });

  it('存后可原样取回（含对象）', () => {
    saveState('obj', { enabled: true, mode: 'city', longitude: 116.4 });
    expect(loadState('obj', null)).toEqual({ enabled: true, mode: 'city', longitude: 116.4 });
  });

  it('校验失败回退 fallback（防脏数据）', () => {
    saveState('engineId', 'nonexistent-engine');
    const valid = loadState('engineId', 'sanmeta', (v) => ['sanmeta', 'bigfish'].includes(v as string));
    expect(valid).toBe('sanmeta');
  });

  it('坏 JSON 回退 fallback', () => {
    localStorage.setItem('react-qimen:v1:broken', '{not json');
    expect(loadState('broken', 'safe')).toBe('safe');
  });

  it('getItem 抛异常（隐私模式）时回退，不抛出', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => loadState('k', 'fallback')).not.toThrow();
    expect(loadState('k', 'fallback')).toBe('fallback');
  });

  it('setItem 抛异常（配额超限）时返回 false，不抛出', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveState('k', 'v')).toBe(false);
  });

  it('key 带命名空间前缀，隔离其他应用', () => {
    saveState('theme', true);
    expect(localStorage.getItem('react-qimen:v1:theme')).toBe('true');
    expect(localStorage.getItem('theme')).toBeNull();
  });
});
