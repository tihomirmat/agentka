import { CircleAlert, ReceiptText } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  SkeletonRows,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { formatDate, formatEurExact } from '@/data/format';
import type { Invoice } from '@/data/types';
import { INVOICE_STATUS } from './helpers';

export interface InvoicesCardProps {
  invoices: Invoice[] | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** scrolls to the plans; offered when there is no invoice yet */
  onShowPlans: () => void;
}

/**
 * Izdani računi. The data holds one description per invoice and no lines, and downloads are
 * not allowed in the preview, so the table has no action column.
 */
export function InvoicesCard({ invoices, loading, error, onRetry, onShowPlans }: InvoicesCardProps) {
  return (
    <Card>
      <CardHeader
        title="Izdani računi"
        description="Računi za naročnino, od najnovejšega."
        divider
      />
      {loading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <EmptyState
          icon={CircleAlert}
          title={error}
          action={<Button onClick={onRetry}>Poskusi znova</Button>}
        />
      ) : (
        <Table
          minWidth={640}
          caption="Izdani računi"
          empty={
            invoices?.length === 0 && (
              <EmptyState
                icon={ReceiptText}
                title="Prvi račun se pojavi, ko začnete plačevati naročnino."
                action={<Button onClick={onShowPlans}>Poglej pakete</Button>}
              />
            )
          }
        >
          <THead>
            <TR>
              <TH>Številka</TH>
              <TH>Datum</TH>
              <TH>Opis</TH>
              <TH numeric>Znesek</TH>
              <TH>Stanje</TH>
            </TR>
          </THead>
          <TBody>
            {invoices?.map((invoice) => {
              const status = INVOICE_STATUS[invoice.status];
              return (
                <TR key={invoice.id}>
                  <TD nowrap className="font-mono text-sm">
                    {invoice.number}
                  </TD>
                  <TD nowrap>{formatDate(invoice.issued_at)}</TD>
                  <TD muted>{invoice.description}</TD>
                  <TD numeric>{formatEurExact(invoice.amount_eur)}</TD>
                  <TD>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
