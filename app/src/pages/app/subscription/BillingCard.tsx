import { CreditCard, Info } from 'lucide-react';
import { Button, Card, CardBody } from '@/components/ui';

export interface BillingCardProps {
  pending: boolean;
  /** the API's own sentence from the last click, shown unchanged */
  lastMessage: string | null;
  onManage: () => void;
}

/** Plačilo: the card itself is handled by the payment provider's portal, so no card data appears here. */
export function BillingCard({ pending, lastMessage, onManage }: BillingCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1 basis-72">
            <h2 className="text-md font-semibold text-fg">Plačilo</h2>
            <p className="mt-0.5 text-sm text-fg-muted">Plačilno sredstvo zamenjate v portalu za plačila.</p>
          </div>
          <Button icon={CreditCard} loading={pending} onClick={onManage}>
            Upravljaj plačilno sredstvo
          </Button>
        </div>
        {lastMessage ? (
          <p className="flex items-start gap-2 border-t border-border pt-3 text-sm text-fg-muted" role="status">
            <Info size={14} className="mt-[3px] shrink-0 text-info" aria-hidden="true" />
            <span>{lastMessage}</span>
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
