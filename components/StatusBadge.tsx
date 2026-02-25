import { Status, STATUS_LABELS, STATUS_COLORS } from '@/types';

interface Props {
  status: Status;
}

export default function StatusBadge({ status }: Props) {
  const { bg, text } = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${bg} ${text}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
