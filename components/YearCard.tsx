import { YearDoc } from '@/types';

interface Props {
  yearDoc: YearDoc;
  total: number;
  completed: number;
  onClick: () => void;
}

export default function YearCard({ yearDoc, total, completed, onClick }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-gray-900">{yearDoc.year}</span>
        <span className="text-sm font-semibold text-gray-500">{pct}%</span>
      </div>

      {/* 進捗バー */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gray-800 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-400">
        {total === 0
          ? 'まだ何もありません'
          : `${completed} / ${total} 件完了`}
      </p>
    </button>
  );
}
