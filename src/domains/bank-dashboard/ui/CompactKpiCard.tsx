import { Info } from 'lucide-react';

type Tone = 'red' | 'blue' | 'rose' | 'slate';

type CompactKpiCardProps = {
  title: string;
  value: string;
  hint: string;
  tooltip: string;
  tone: Tone;
};

const toneStyles: Record<
  Tone,
  {
    accent: string;
    value: string;
    glow: string;
  }
> = {
  red: {
    accent: 'bg-[#f10d30]',
    value: 'text-[#f10d30]',
    glow: 'from-[#f10d30]/10 to-transparent',
  },
  blue: {
    accent: 'bg-[#10385c]',
    value: 'text-[#10385c]',
    glow: 'from-[#10385c]/10 to-transparent',
  },
  rose: {
    accent: 'bg-rose-500',
    value: 'text-rose-600 dark:text-rose-300',
    glow: 'from-rose-500/10 to-transparent',
  },
  slate: {
    accent: 'bg-slate-500',
    value: 'text-slate-700 dark:text-slate-200',
    glow: 'from-slate-500/10 to-transparent',
  },
};

export function CompactKpiCard({
  title,
  value,
  hint,
  tooltip,
  tone,
}: CompactKpiCardProps) {
  const style = toneStyles[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>{title}</span>
            <span title={tooltip} className="inline-flex cursor-help items-center text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className={`mt-2 text-2xl font-semibold md:text-3xl ${style.value}`}>
            {value}
          </div>

          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
    </div>
  );
}