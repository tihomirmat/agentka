import { Skeleton, Stat } from '@/components/ui';
import * as api from '@/data/api';
import { formatDate, formatNumber } from '@/data/format';
import { Pending } from './parts';

/** The four numbers of the current billing period. */
export function StatsRow() {
  const stats = api.useQuery(() => api.getOverviewStats(), []);
  const s = stats.data;

  if (!s) {
    if (stats.error) {
      return (
        <div className="rounded-lg border border-border bg-surface">
          <Pending queries={[stats]} />
        </div>
      );
    }
    return (
      <div role="status" aria-label="Nalaganje" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[5.75rem] rounded-lg" />
        ))}
      </div>
    );
  }

  const used = Math.round(s.minutes_used);
  const left = Math.max(0, Math.round(s.minutes_included - s.minutes_used));
  const ratio = s.minutes_included > 0 ? s.minutes_used / s.minutes_included : 0;
  const minutesNote =
    ratio >= 1 ? 'minute so porabljene' : ratio >= 0.8 ? `samo še ${formatNumber(left)} min` : `še ${formatNumber(left)} min`;

  return (
    <section aria-labelledby="overview-period" className="min-w-0">
      <p id="overview-period" className="mb-3 text-sm text-fg-muted">
        Obdobje:{' '}
        <span className="nums font-medium text-fg">
          {formatDate(s.period_start)} – {formatDate(s.period_end)}
        </span>
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pogovori" value={formatNumber(s.conversations)} sub="v tem obdobju" />
        <Stat label="Kontakti" value={formatNumber(s.leads)} sub="v tem obdobju" />
        <Stat label="Rezervacije" value={formatNumber(s.bookings)} sub="v tem obdobju" />
        <Stat
          label="Porabljene minute"
          value={formatNumber(used)}
          unit={`/ ${formatNumber(s.minutes_included)} min`}
          progress={{ value: s.minutes_used, max: s.minutes_included }}
          sub={minutesNote}
        />
      </div>
    </section>
  );
}
