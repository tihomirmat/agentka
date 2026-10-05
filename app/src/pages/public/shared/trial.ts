import * as api from '@/data/api';
import { formatTrialTerms } from '@/data/format';

/**
 * The terms of the free trial in numbers ("14 dni in 30 minut pogovorov"), read from
 * api.getTrialTerms(). null while loading or if it cannot be read — then the page simply
 * leaves the numbers out instead of guessing. Print it ONCE per page; say nothing about cards.
 */
export function useTrialTermsText(): string | null {
  const terms = api.useQuery(() => api.getTrialTerms(), []);
  return terms.data ? formatTrialTerms(terms.data) : null;
}
