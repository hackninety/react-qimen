/** 剪贴板写入：优先 Clipboard API，失败时回退 execCommand（旧浏览器/无焦点环境） */
export async function copyText(value: string | (() => string)): Promise<boolean> {
  const currentText = () => typeof value === 'function' ? value() : value;
  try {
    await navigator.clipboard.writeText(currentText());
    return true;
  } catch {
    // 继续尝试回退方案
  }
  try {
    const ta = document.createElement('textarea');
    // 权限等待期间模式可能关闭，回退时重新计算允许复制的内容。
    ta.value = currentText();
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
