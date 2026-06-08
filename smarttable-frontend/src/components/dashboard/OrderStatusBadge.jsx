import { getStatutConfig } from '../../lib/orderUtils';
import Badge from '../ui/Badge';

const VARIANT_MAP = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'violet',
  ready: 'success',
  delivered: 'success',
  cancelled: 'danger',
};

export default function OrderStatusBadge({ status, statut, className = '' }) {
  const key = status || statut;
  const config = getStatutConfig(key);
  const variant = VARIANT_MAP[key] || 'default';

  return (
    <Badge variant={variant} dot pulse={key === 'pending'} className={className}>
      {config.label}
    </Badge>
  );
}
