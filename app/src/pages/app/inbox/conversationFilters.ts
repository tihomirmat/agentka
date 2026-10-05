/**
 * Filters of the conversation list. They live in the URL (search part of the hash route), so
 * opening a conversation and coming back keeps them, and the detail page can walk the same list.
 *   #/app/pogovori?obdobje=7&izid=lead&q=oglasi
 */
import type { Conversation, ConversationOutcome } from '@/data/api';
import { dayDiff } from '@/data/format';
import { matchesAllWords } from './search';

export type Period = '7' | '30' | 'all';
export type OutcomeFilter = 'all' | ConversationOutcome;

export interface ConversationFilters {
  period: Period;
  outcome: OutcomeFilter;
  /** search text, as typed */
  q: string;
}

export const DEFAULT_FILTERS: ConversationFilters = { period: '30', outcome: 'all', q: '' };

const PERIOD_PARAM: Record<Period, string> = { '7': '7', '30': '30', all: 'vse' };

export function readFilters(params: URLSearchParams): ConversationFilters {
  const period = params.get('obdobje');
  const outcome = params.get('izid');
  return {
    period: period === '7' ? '7' : period === 'vse' ? 'all' : DEFAULT_FILTERS.period,
    outcome: outcome === 'question' || outcome === 'lead' || outcome === 'booking' ? outcome : 'all',
    q: params.get('q') ?? '',
  };
}

/** Only what differs from the defaults goes into the URL. */
export function writeFilters(filters: ConversationFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.period !== DEFAULT_FILTERS.period) params.set('obdobje', PERIOD_PARAM[filters.period]);
  if (filters.outcome !== 'all') params.set('izid', filters.outcome);
  if (filters.q.trim()) params.set('q', filters.q);
  return params;
}

export function isDefault(filters: ConversationFilters): boolean {
  return filters.period === DEFAULT_FILTERS.period && filters.outcome === 'all' && !filters.q.trim();
}

/** "7 dni" = today and the six days before it. */
export function inPeriod(list: Conversation[], period: Period, now: Date = new Date()): Conversation[] {
  if (period === 'all') return list;
  const days = period === '7' ? 7 : 30;
  return list.filter((c) => dayDiff(c.started_at, now) > -days);
}

export function matchesQuery(c: Conversation, q: string): boolean {
  return matchesAllWords([c.visitor_name, c.summary, c.topic], q);
}

/** The list as the person sees it: period, then outcome, then search. Order is kept (newest first). */
export function filterConversations(list: Conversation[], filters: ConversationFilters): Conversation[] {
  return inPeriod(list, filters.period).filter(
    (c) => (filters.outcome === 'all' || c.outcome === filters.outcome) && matchesQuery(c, filters.q),
  );
}
