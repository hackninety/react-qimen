/**
 * localStorage 持久化核心（纯函数，便于单测）。
 *
 * 只存起局输入参数，不存派生盘面——刷新后由引擎重算，避免缓存与引擎版本不一致。
 * 全程异常保护：隐私模式 / 配额超限 / 脏数据时静默降级，绝不抛出打断渲染。
 */
const PREFIX = 'react-qimen:v1:';

/** 读取并按需校验；无值/坏 JSON/校验失败/环境不支持 均回退 fallback */
export function loadState<T>(key: string, fallback: T, validate?: (v: unknown) => boolean): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** 写入；失败时静默（返回 false 供调用方感知，通常忽略） */
export function saveState(key: string, value: unknown): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
