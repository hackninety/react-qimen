import { MapPin } from 'lucide-react';
import { PROVINCES } from '@/lib/cities';
import type { SolarTimeMode, SolarTimeResult, SolarTimeSetting } from '@/utils/true-solar-time';
import { formatOffset } from '@/utils/true-solar-time';

interface Props {
  setting: SolarTimeSetting;
  result: SolarTimeResult;
  onChange(s: SolarTimeSetting): void;
}

const selectCls =
  'rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function SolarTimeControl({ setting, result, onChange }: Props) {
  const set = (patch: Partial<SolarTimeSetting>) => onChange({ ...setting, ...patch });

  const province = PROVINCES.find((p) => p.name === setting.province);
  const cities = province?.cities ?? [];
  const city = cities.find((c) => c.name === setting.city);
  const districts = city?.districts ?? [];

  const changeProvince = (name: string) => {
    const p = PROVINCES.find((x) => x.name === name);
    const firstCity = p?.cities[0];
    set({ province: name, city: firstCity?.name ?? '', district: firstCity?.districts[0]?.name ?? '' });
  };
  const changeCity = (name: string) => {
    const c = province?.cities.find((x) => x.name === name);
    set({ city: name, district: c?.districts[0]?.name ?? '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground select-none">
        <input
          type="checkbox"
          checked={setting.enabled}
          onChange={(e) => set({ enabled: e.target.checked })}
          className="accent-[var(--color-gold)]"
        />
        <MapPin size={14} />
        真太阳时
      </label>

      {setting.enabled && (
        <>
          <select value={setting.mode} onChange={(e) => set({ mode: e.target.value as SolarTimeMode })} className={selectCls}>
            <option value="city">选择城市</option>
            <option value="auto">当前时区（自动）</option>
            <option value="manual">手动经度</option>
          </select>

          {setting.mode === 'city' && (
            <>
              <select value={setting.province} onChange={(e) => changeProvince(e.target.value)} className={selectCls}>
                {PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <select value={setting.city} onChange={(e) => changeCity(e.target.value)} className={selectCls}>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select value={setting.district} onChange={(e) => set({ district: e.target.value })} className={selectCls}>
                {districts.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </>
          )}

          {setting.mode === 'manual' && (
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              东经
              <input
                type="number"
                step="0.01"
                min="-180"
                max="180"
                value={setting.manualLongitude}
                onChange={(e) => set({ manualLongitude: Number(e.target.value) })}
                className={`${selectCls} w-24`}
              />
              °
            </label>
          )}

          {result.applied && (
            <span className="text-xs text-[var(--color-gold)]/90">
              {result.place} · 修正 {formatOffset(result.offsetMinutes ?? 0)} → {pad2(result.date.getHours())}:{pad2(result.date.getMinutes())}
              <em className="ml-1 not-italic text-muted-foreground">
                （经度 {formatOffset(result.longitudeCorrectionMinutes ?? 0)}，均时差 {formatOffset(result.eotMinutes ?? 0)}）
              </em>
            </span>
          )}
        </>
      )}
    </div>
  );
}
