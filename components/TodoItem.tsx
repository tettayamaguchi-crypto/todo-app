'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Todo,
  Period,
  Step,
  PERIOD_LABELS,
  PERIOD_OPTIONS,
  getRemainingDays,
  getRemainingLabel,
  getRemainingColor,
  formatCustomDate,
} from '@/types';
import StepList from './StepList';

interface Props {
  todo: Todo;
  isLoadingAI: boolean;
  onToggle: (completed: boolean) => void;
  onUpdate: (text: string, period: Period, customDueDate?: string) => void;
  onDelete: () => void;
  onSuggest: () => void;
  onStepsChange: (steps: Step[]) => void;
}

export default function TodoItem({
  todo,
  isLoadingAI,
  onToggle,
  onUpdate,
  onDelete,
  onSuggest,
  onStepsChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editPeriod, setEditPeriod] = useState<Period>(todo.period);
  const [editCustomDate, setEditCustomDate] = useState(todo.customDueDate ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ステップのローカル状態（デバウンス保存中に Firestore から上書きされないよう管理）
  const [localSteps, setLocalSteps] = useState<Step[]>(todo.steps ?? []);
  const isSavingStepsRef = useRef(false);
  const stepsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 外部から steps が変わったときだけ同期（自分で保存中は無視）
  useEffect(() => {
    if (!isSavingStepsRef.current) {
      setLocalSteps(todo.steps ?? []);
    }
  }, [todo.steps]);

  useEffect(() => {
    return () => {
      if (stepsTimerRef.current) clearTimeout(stepsTimerRef.current);
    };
  }, []);

  const handleStepsChange = (steps: Step[]) => {
    setLocalSteps(steps);
    isSavingStepsRef.current = true;
    if (stepsTimerRef.current) clearTimeout(stepsTimerRef.current);
    stepsTimerRef.current = setTimeout(() => {
      onStepsChange(steps);
      isSavingStepsRef.current = false;
      stepsTimerRef.current = null;
    }, 600);
  };

  const handleSave = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onUpdate(trimmed, editPeriod, editPeriod === 'custom' ? editCustomDate : undefined);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditPeriod(todo.period);
    setEditCustomDate(todo.customDueDate ?? '');
    setEditing(false);
  };

  const remainingDays = getRemainingDays(todo);
  const remainingLabel = getRemainingLabel(remainingDays);
  const remainingColor = getRemainingColor(remainingDays);
  const hasAIContent = isLoadingAI || (todo.nextActions && todo.nextActions.length > 0);
  const today = new Date().toISOString().split('T')[0];

  // ---- 編集モード ----
  if (editing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={editPeriod}
              onChange={(e) => {
                setEditPeriod(e.target.value as Period);
                if (e.target.value !== 'custom') setEditCustomDate('');
              }}
              className="flex-1 sm:flex-none px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={editPeriod === 'custom' && !editCustomDate}
              className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              キャンセル
            </button>
          </div>
        </div>
        {editPeriod === 'custom' && (
          <div className="flex items-center gap-2 pl-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">期限日：</span>
            <input
              type="date"
              value={editCustomDate}
              onChange={(e) => setEditCustomDate(e.target.value)}
              min={today}
              className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
            />
          </div>
        )}
      </div>
    );
  }

  // ---- 通常表示 ----
  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden ${
        todo.completed ? 'border-gray-100 opacity-50' : 'border-gray-100'
      }`}
    >
      {/* メイン行 */}
      <div className="flex items-start gap-3 px-3 pt-3 pb-2 group">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 flex-shrink-0 cursor-pointer accent-gray-600 mt-0.5"
        />

        {/* テキスト + バッジ */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm break-all leading-relaxed ${
              todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {todo.text}
          </span>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* 期間バッジ */}
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {todo.period === 'custom' && todo.customDueDate
                ? formatCustomDate(todo.customDueDate)
                : PERIOD_LABELS[todo.period]}
            </span>
            {/* 残り日数 */}
            {remainingLabel && (
              <span className={`text-xs ${remainingColor}`}>{remainingLabel}</span>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">削除しますか？</span>
              <button
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded transition-colors whitespace-nowrap"
              >
                削除
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
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
                AIに相談
              </button>
            </>
          )}
        </div>
      </div>

      {/* ステップ欄（完了済みは非表示） */}
      {!todo.completed && (
        <div className="px-3 pb-3 pl-10">
          <StepList steps={localSteps} onChange={handleStepsChange} />
        </div>
      )}

      {/* AI提案セクション */}
      {hasAIContent && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-50">
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
            todo.nextActions &&
            todo.nextActions.length > 0 && (
              <ul className="pt-1.5 space-y-1.5 pl-7">
                {todo.nextActions.map((action, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                    <span className="text-gray-300 flex-shrink-0 mt-0.5">›</span>
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
