import { HelpCircle } from 'lucide-react';
import { TOPICS } from '@/lib/yongshen-rules';

interface Props {
  topicId: string;
  subject: string;
  /** 求测人公历生年（4 位数字字符串，可空） */
  birthYear: string;
  onTopicChange(id: string): void;
  onSubjectChange(s: string): void;
  onBirthYearChange(y: string): void;
}

const selectCls =
  'rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring';

/** 所占何事：占类决定用神取用与注入 AI 的古法原文；生年定年命落宫 */
export function InquiryBar({ topicId, subject, birthYear, onTopicChange, onSubjectChange, onBirthYearChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <HelpCircle size={13} className="text-[var(--color-gold)]/80" />
        所占
        <select value={topicId} onChange={(e) => onTopicChange(e.target.value)} className={selectCls}>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <input
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        placeholder="事由（可留空）：如 本月能否谈成某合作"
        className={`${selectCls} flex-1 min-w-48 placeholder:text-muted-foreground/50`}
        maxLength={60}
      />
      <input
        value={birthYear}
        onChange={(e) => onBirthYearChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="生年"
        title="求测人公历生年（可选）：年命干支落宫将列入用神；生于立春前请填上一年"
        inputMode="numeric"
        className={`${selectCls} w-20 placeholder:text-muted-foreground/50`}
        maxLength={4}
      />
    </div>
  );
}
