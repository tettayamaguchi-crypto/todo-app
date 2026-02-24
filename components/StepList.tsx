'use client';

import { useState } from 'react';
import { Step } from '@/types';

interface Props {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function StepList({ steps, onChange }: Props) {
  const [newText, setNewText] = useState('');

  const update = (id: string, patch: Partial<Step>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const remove = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  const add = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onChange([...steps, { id: newId(), text: trimmed, completed: false }]);
    setNewText('');
  };

  return (
    <div>
      {/* ラベル */}
      <p className="text-xs text-gray-400 mb-1.5">やり切るためのステップ</p>

      {/* ステップ一覧 */}
      {steps.map((step) => (
        <div key={step.id} className="group mb-2 last:mb-1">
          <div className="flex items-start gap-2">
            {/* 完了チェック */}
            <input
              type="checkbox"
              checked={step.completed}
              onChange={(e) => update(step.id, { completed: e.target.checked })}
              className="mt-0.5 w-3.5 h-3.5 accent-gray-600 flex-shrink-0 cursor-pointer"
            />
            {/* テキスト */}
            <input
              type="text"
              value={step.text}
              onChange={(e) => update(step.id, { text: e.target.value })}
              placeholder="ステップを入力..."
              className={`flex-1 min-w-0 text-xs bg-transparent focus:outline-none ${
                step.completed ? 'line-through text-gray-400' : 'text-gray-700'
              }`}
            />
            {/* 削除ボタン（モバイルは常時、デスクトップはホバー） */}
            <button
              onClick={() => remove(step.id)}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-sm leading-none mt-0.5"
              aria-label="削除"
            >
              ×
            </button>
          </div>
          {/* 期限日ピッカー */}
          <div className="pl-5 mt-0.5">
            <input
              type="date"
              value={step.dueDate ?? ''}
              onChange={(e) =>
                update(step.id, { dueDate: e.target.value || undefined })
              }
              className="text-[11px] text-gray-400 bg-transparent focus:outline-none focus:text-gray-600"
            />
          </div>
        </div>
      ))}

      {/* 新規ステップ追加 */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-gray-300 text-xs flex-shrink-0 select-none">＋</span>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="ステップを追加..."
          className="flex-1 text-xs text-gray-500 placeholder-gray-300 bg-transparent focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        {newText.trim() && (
          <button
            type="button"
            onClick={add}
            className="text-xs text-gray-400 hover:text-gray-700 whitespace-nowrap transition-colors"
          >
            追加
          </button>
        )}
      </div>
    </div>
  );
}
