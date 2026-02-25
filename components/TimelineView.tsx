'use client';

import { Item, MONTH_NAMES, CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';

interface Props {
  items: Item[];
}

export default function TimelineView({ items }: Props) {
  const itemsByMonth: Record<number, Item[]> = {};
  const unscheduled: Item[] = [];

  for (const item of items) {
    if (item.targetMonth) {
      if (!itemsByMonth[item.targetMonth]) itemsByMonth[item.targetMonth] = [];
      itemsByMonth[item.targetMonth].push(item);
    } else {
      unscheduled.push(item);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        やりたいことを追加して、タイムラインを作りましょう
      </p>
    );
  }

  return (
    <div>
      {/* 月ごとのタイムライン */}
      <div className="space-y-2">
        {MONTH_NAMES.map((monthName, i) => {
          const month = i + 1;
          const monthItems = itemsByMonth[month] ?? [];
          return (
            <div key={month} className="flex gap-3 items-start">
              {/* 月ラベル */}
              <div className="w-8 flex-shrink-0 text-xs text-gray-400 font-medium pt-2 text-right">
                {monthName}
              </div>

              {/* 区切り線 + アイテム */}
              <div className="flex-1 min-w-0">
                {monthItems.length === 0 ? (
                  <div className="h-8 flex items-center">
                    <div className="w-full h-px bg-gray-100" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {monthItems.map((item) => {
                      const { bg, text, bar } = CATEGORY_COLORS[item.category];
                      const isCompleted = item.status === 'completed';
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-opacity ${bg} ${text} ${
                            isCompleted ? 'opacity-50 line-through' : ''
                          }`}
                          title={`${CATEGORY_LABELS[item.category]} · ${item.status === 'completed' ? '完了' : item.status === 'inProgress' ? '進行中' : '未着手'}`}
                        >
                          {/* カテゴリカラードット */}
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${bar}`} />
                          <span className="max-w-[180px] truncate">{item.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 月未設定のアイテム */}
      {unscheduled.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">月が未設定</p>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((item) => {
              const { bg, text, bar } = CATEGORY_COLORS[item.category];
              const isCompleted = item.status === 'completed';
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text} ${
                    isCompleted ? 'opacity-50 line-through' : ''
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${bar}`} />
                  <span className="max-w-[180px] truncate">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
