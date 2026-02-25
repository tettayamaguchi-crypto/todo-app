'use client';

import { useRef, useState } from 'react';
import {
  Item,
  Category,
  Status,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  MONTH_NAMES,
} from '@/types';

interface Props {
  initial?: Partial<Item>;
  onSave: (data: Omit<Item, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function ItemForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'other');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'notStarted');
  const [targetMonth, setTargetMonth] = useState<number | undefined>(initial?.targetMonth);
  const isComposingRef = useRef(false);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      category,
      status,
      targetMonth,
      steps: initial?.steps ?? [],
      nextActions: initial?.nextActions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />

      {/* フォーム */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          {initial?.title ? 'やりたいことを編集' : 'やりたいことを追加'}
        </h2>

        {/* タイトル */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isComposingRef.current) handleSubmit(); }}
            placeholder="例：バイクで北海道を旅する"
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        {/* カテゴリ */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">カテゴリ</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  category === value
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          {/* ステータス */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">状況</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* 目標月 */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">目標月</label>
            <select
              value={targetMonth ?? ''}
              onChange={(e) =>
                setTargetMonth(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">未設定</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {initial?.title ? '保存' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
