import { Hammer } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '@/components/ui';

/**
 * What every screen shows until its engineer replaces the file.
 * `frame="page"` adds the centred column for public pages (the app shells add it themselves).
 */
export function Placeholder({
  title,
  description,
  frame = 'none',
}: {
  title: string;
  description: string;
  frame?: 'none' | 'page';
}) {
  const body = (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState icon={Hammer} title="Zaslon je v izdelavi." />
      </Card>
    </>
  );
  return frame === 'page' ? <div className="page py-8 sm:py-12">{body}</div> : body;
}
