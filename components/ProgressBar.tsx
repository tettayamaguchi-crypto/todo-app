'use client';

interface Props {
  total: number;
  completed: number;
}

export default function ProgressBar({ total, completed }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs text-gray-500">
          {completed} / {total} 達成
        </span>
        <span className="text-xs font-medium text-gray-700">{pct}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-700 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
