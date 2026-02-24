'use client';

import { useState } from 'react';
import { Period, PERIOD_OPTIONS } from '@/types';

interface Props {
  onAdd: (text: string, period: Period, customDueDate?: string) => Promise<void>;
}

export default function AddTodoForm({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isCustomInvalid = period === 'custom' && !customDate;
  const canSubmit = !!text.trim() && !loading && !isCustomInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading || isCustomInvalid) return;
    setLoading(true);
    try {
      await onAdd(trimmed, period, period === 'custom' ? customDate : undefined);
      setText('');
      // customDate は残しておく（連続入力しやすいように）
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* テキスト入力 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="やりたいことを入力..."
          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white"
          disabled={loading}
        />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
          disabled={loading}
        >
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          追加
        </button>
      </div>

      {/* 日付ピッカー（period === 'custom' のときのみ表示） */}
      {period === 'custom' && (
        <div className="flex items-center gap-2 pl-1">
          <span className="text-xs text-gray-500 whitespace-nowrap">期限日：</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={today}
            required
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
            disabled={loading}
          />
        </div>
      )}
    </form>
  );
}
