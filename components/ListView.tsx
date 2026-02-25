'use client';

import { useState } from 'react';
import { Item, Category, Status, CATEGORY_OPTIONS, STATUS_OPTIONS, MONTH_NAMES } from '@/types';
import ItemCard from './ItemCard';
import ItemForm from './ItemForm';

interface Props {
  items: Item[];
  isLoadingAI: Set<string>;
  onAdd: (data: Omit<Item, 'id' | 'createdAt'>) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>) => void;
  onDelete: (itemId: string) => void;
  onSuggest: (itemId: string) => void;
}

type FilterCategory = Category | 'all';
type FilterStatus = Status | 'all';

export default function ListView({ items, isLoadingAI, onAdd, onUpdate, onDelete, onSuggest }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filtered = items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  // 完了を下、未完了は目標月昇順（未設定は末尾）
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.targetMonth == null && b.targetMonth == null) return a.createdAt - b.createdAt;
    if (a.targetMonth == null) return 1;
    if (b.targetMonth == null) return -1;
    return a.targetMonth - b.targetMonth;
  });

  return (
    <div>
      {/* フィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* カテゴリフィルター */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              filterCategory === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterCategory(value)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                filterCategory === value
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ステータスフィルター */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
            filterStatus === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          すべて
        </button>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value as Status)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              filterStatus === value
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* リスト */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            {filterCategory !== 'all' || filterStatus !== 'all'
              ? '条件に合う項目がありません'
              : 'やりたいことを追加しましょう'}
          </p>
        ) : (
          sorted.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isLoadingAI={isLoadingAI.has(item.id)}
              onUpdate={(updates) => onUpdate(item.id, updates)}
              onDelete={() => onDelete(item.id)}
              onSuggest={() => onSuggest(item.id)}
            />
          ))
        )}
      </div>

      {/* 追加ボタン */}
      <button
        onClick={() => setShowForm(true)}
        className="mt-4 w-full py-3 border border-dashed border-gray-200 text-gray-400 text-sm rounded-xl hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        ＋ やりたいことを追加
      </button>

      {/* 追加フォーム */}
      {showForm && (
        <ItemForm
          onSave={(data) => {
            onAdd(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
