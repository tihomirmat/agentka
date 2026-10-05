/** Small building block shared by the cards of Pregled. */
import { CircleAlert } from 'lucide-react';
import { Button, CardBody, EmptyState, SkeletonText } from '@/components/ui';
import type { QueryResult } from '@/data/api';

/** Shown inside a card until all its queries have an answer; an error comes with a retry button. */
export function Pending({ queries, lines = 3 }: { queries: QueryResult<unknown>[]; lines?: number }) {
  const error = queries.find((q) => q.error)?.error;
  if (error) {
    return (
      <EmptyState
        compact
        icon={CircleAlert}
        title={error}
        action={
          <Button size="sm" onClick={() => queries.forEach((q) => q.reload())}>
            Poskusi znova
          </Button>
        }
      />
    );
  }
  return (
    <CardBody>
      <SkeletonText lines={lines} />
    </CardBody>
  );
}
