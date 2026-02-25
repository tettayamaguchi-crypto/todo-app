'use client';

import { useRef, useState } from 'react';
import {
  Item,
  Category,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_OPTIONS,
} from '@/types';
import CategoryTag from './CategoryTag';
import StatusBadge from './StatusBadge';

interface Props {
  year: string;
  items: Item[];
  memo: string;
  onMemoChange: (memo: string) => void;
  onCarryOver: (item: Item) => Promise<void>;
}

export default function RetrospectiveView({
  year,
  items,
  memo,
  onMemoChange,
  onCarryOver,
}: Props) {
  const [carryingOver, setCarryingOver] = useState<Set<string>>(new Set());
  const [carriedOver, setCarriedOver] = useState<Set<string>>(new Set());
  const memoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = items.length;
  const completedItems = items.filter((i) => i.status === 'completed');
  const incompleteItems = items.filter((i) => i.status !== 'completed');
  const pct = total === 0 ? 0 : Math.round((completedItems.length / total) * 100);

  // カテゴリ別達成率（アイテムがある分だけ）
  const categories = CATEGORY_OPTIONS.map(({ value }) => value) as Category[];
  const categoriesWithItems = categories.filter((cat) =>
    items.some((i) => i.category === cat)
  );

  const handleMemoInput = (value: string) => {
    onMemoChange(value);
    // 親に即時反映（デバウンス保存は親側で処理）
  };

  const handleCarryOver = async (item: Item) => {
    setCarryingOver((prev) => new Set(prev).add(item.id));
    try {
      await onCarryOver(item);
      setCarriedOver((prev) => new Set(prev).add(item.id));
    } finally {
      setCarryingOver((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const nextYear = String(Number(year) + 1);

  if (total === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">
          まだやりたいことが登録されていません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 年間達成率 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{year}年の達成率</h2>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-4xl font-bold text-gray-900">{pct}%</span>
          <span className="text-sm text-gray-400 mb-1">
            {completedItems.length} / {total} 件完了
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-800 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* カテゴリ別達成率 */}
      {categoriesWithItems.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">カテゴリ別達成率</h2>
          <div className="space-y-3">
            {categoriesWithItems.map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              const catCompleted = catItems.filter((i) => i.status === 'completed').length;
              const catPct =
                catItems.length === 0
                  ? 0
                  : Math.round((catCompleted / catItems.length) * 100);
              const { bar, text, bg } = CATEGORY_COLORS[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${text}`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {catCompleted}/{catItems.length}件 {catPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all`}
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 達成したこと */}
      {completedItems.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            達成したこと 🎉
          </h2>
          <ul className="space-y-2">
            {completedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="text-green-500 flex-shrink-0">✓</span>
                <span className="text-sm text-gray-700 flex-1 min-w-0">{item.title}</span>
                <CategoryTag category={item.category} small />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未達成のこと */}
      {incompleteItems.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            未達成のこと
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            「来年に持ち越す」で{nextYear}年のリストにコピーできます
          </p>
          <ul className="space-y-2.5">
            {incompleteItems.map((item) => {
              const carried = carriedOver.has(item.id);
              const carrying = carryingOver.has(item.id);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2"
                >
                  <span className="text-gray-300 flex-shrink-0">○</span>
                  <span className="text-sm text-gray-600 flex-1 min-w-0">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusBadge status={item.status} />
                    <CategoryTag category={item.category} small />
                    <button
                      onClick={() => handleCarryOver(item)}
                      disabled={carrying || carried}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                        carried
                          ? 'border-green-200 text-green-600 bg-green-50 cursor-default'
                          : carrying
                          ? 'border-gray-200 text-gray-400 cursor-wait'
                          : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      {carried
                        ? '✓ 持ち越し済み'
                        : carrying
                        ? '処理中...'
                        : `${nextYear}年に持ち越す`}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ふりかえりメモ */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">ふりかえりメモ</h2>
        <p className="text-xs text-gray-400 mb-3">{year}年を振り返って、自由に書いてみましょう</p>
        <textarea
          value={memo}
          onChange={(e) => handleMemoInput(e.target.value)}
          placeholder={`${year}年はどんな一年でしたか？`}
          rows={6}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 resize-none leading-relaxed"
        />
        <p className="text-right text-xs text-gray-300 mt-1">自動保存</p>
      </div>
    </div>
  );
}
