import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { loadState, saveState } from '@/utils/persist';

/**
 * 与 useState 同签名（支持函数式更新），但状态持久化到 localStorage。
 * 首次渲染惰性读取，之后每次变更写回；异常静默降级为普通状态。
 *
 * @param validate 对读回值的合法性校验（防旧版本/篡改脏数据），失败则用默认值
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T | (() => T),
  validate?: (v: unknown) => boolean,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const fallback = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    return loadState(key, fallback, validate);
  });

  useEffect(() => {
    saveState(key, state);
  }, [key, state]);

  return [state, setState];
}
