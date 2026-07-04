const pad = (n: number) => String(n).padStart(2, '0');

/** Date → datetime-local 输入框值 */
export function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local 输入框值 → Date（非法时返回 null） */
export function fromInputValue(v: string): Date | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
