import { Chip } from '@mui/material';
import { PaymentStatus } from '../types';

const statusConfig: Record<PaymentStatus, { color: 'success'|'error'|'warning'|'info'|'default', label: string }> = {
  COMPLETED:  { color: 'success', label: 'Completed' },
  FAILED:     { color: 'error',   label: 'Failed' },
  PENDING:    { color: 'warning', label: 'Pending' },
  PROCESSING: { color: 'info',    label: 'Processing' },
  REVERSED:   { color: 'default', label: 'Reversed' },
};

export default function StatusChip({ status }: { status: PaymentStatus }) {
  const cfg = statusConfig[status] ?? { color: 'default', label: status };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}
