'use client';

import { useEffect, useRef, useState } from 'react';
import { Item, Step, Status, STATUS_OPTIONS, MONTH_NAMES } from '@/types';
import CategoryTag from './CategoryTag';
import StatusBadge from './StatusBadge';
import StepList from './StepList';
import ItemForm from './ItemForm';

interface Props {
  item: Item;
  isLoadingAI: boolean;
  onUpdate: (updates: Partial<Omit<Item, 'id' | 'createdAt'>>) => void;
  onDelete: () => void;
  onSuggest: () => void;
}

export default function ItemCard({ item, isLoadingAI, onUpdate, onDelete, onSuggest }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ステップのローカル状態（デバウンス保存）
  const [localSteps, setLocalSteps] = useState<Step[]>(item.steps);
  const isSavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSavingRef.current) {
      setLocalSteps(item.steps);
    }
  }, [item.steps]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleStepsChange = (steps: Step[]) => {
    setLocalSteps(steps);
    isSavingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdate({ steps });
      isSavingRef.current = false;
      timerRef.current = null;
    }, 600);
  };

  const isCompleted = item.status === 'completed';
  const hasAI = isLoadingAI || (item.nextActions && item.nextActions.length > 0);

  if (editing) {
    return (
      <ItemForm
        initial={item}
        onSave={(data) => {
          onUpdate(data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-opacity ${
        isCompleted ? 'border-gray-100 opacity-60' : 'border-gray-100'
      }`}
    >
      {/* メイン行 */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2.5 group">
        {/* ステータス切り替えチェック（完了トグル） */}
        <button
          onClick={() =>
            onUpdate({ status: isCompleted ? 'notStarted' : 'completed' })
          }
          className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-gray-500'
          }`}
          aria-label={isCompleted ? '未完了に戻す' : '完了にする'}
        >
          {isCompleted && (
            <svg viewBox="0 0 16 16" fill="none" className="w-full h-full p-0.5">
              <path d="M3 8l3.5 3.5L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* タイトル + バッジ群 */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <p
            className={`text-sm leading-snug ${
              isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <CategoryTag category={item.category} small />
            <StatusBadge status={item.status} />
            {item.targetMonth && (
              <span className="text-xs text-gray-400">
                {MONTH_NAMES[item.targetMonth - 1]}
              </span>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">削除しますか？</span>
              <button
                onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
              >
                削除
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                やめる
              </button>
            </div>
          ) : (
            <>
              <div className="sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity flex gap-0.5">
                <button
                  onClick={() => setEditing(true)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  削除
                </button>
              </div>
              <button
                onClick={onSuggest}
                disabled={isLoadingAI}
                title="AIにネクストアクションを提案してもらう"
                className="px-2 py-1 text-xs text-gray-400 hover:text-indigo-500 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                AI
              </button>
            </>
          )}
        </div>
      </div>

      {/* ステータス変更バー（展開時のみ） */}
      {expanded && !isCompleted && (
        <div className="px-4 pb-2 flex gap-1.5">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdate({ status: value as Status })}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                item.status === value
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ステップ欄（展開時、完了済みは非表示） */}
      {expanded && !isCompleted && (
        <div className="px-4 pb-3 pl-11 border-t border-gray-50 pt-2">
          <StepList steps={localSteps} onChange={handleStepsChange} />
        </div>
      )}

      {/* AI提案セクション */}
      {hasAI && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-50">
          {isLoadingAI ? (
            <div className="flex items-center gap-1.5 pt-1">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">AIが考え中...</span>
            </div>
          ) : (
            item.nextActions &&
            item.nextActions.length > 0 && (
              <ul className="pt-1.5 space-y-1 pl-7">
                {item.nextActions.map((action, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                    <span className="text-gray-300 flex-shrink-0">›</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}
    </div>
  );
}
