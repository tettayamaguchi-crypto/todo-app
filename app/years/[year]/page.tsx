'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  subscribeItems,
  subscribeYear,
  addItem,
  updateItem,
  deleteItem,
  addYear,
  updateYear,
} from '@/lib/firestore';
import { Item, YearDoc, Category, CATEGORY_LABELS, CATEGORY_COLORS } from '@/types';
import ListView from '@/components/ListView';
import TimelineView from '@/components/TimelineView';
import RetrospectiveView from '@/components/RetrospectiveView';

type View = 'list' | 'timeline' | 'retrospective';

export default function YearPage() {
  const params = useParams();
  const year = params.year as string;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [yearDoc, setYearDoc] = useState<YearDoc | null>(null);
  const [view, setView] = useState<View>('list');
  const [loadingAI, setLoadingAI] = useState<Set<string>>(new Set());
  // ふりかえりメモのローカル状態
  const [memo, setMemo] = useState('');
  const memoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoInitializedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/'); return; }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;
    return subscribeItems(user.uid, year, setItems);
  }, [user, year]);

  // 年ドキュメント購読（メモ取得）
  useEffect(() => {
    if (!user) return;
    return subscribeYear(user.uid, year, (doc) => {
      setYearDoc(doc);
      // 初回のみFirestoreの値でローカル状態を初期化
      if (!memoInitializedRef.current) {
        setMemo(doc?.retrospectiveMemo ?? '');
        memoInitializedRef.current = true;
      }
    });
  }, [user, year]);

  useEffect(() => {
    return () => { if (memoTimerRef.current) clearTimeout(memoTimerRef.current); };
  }, []);

  // メモ変更（デバウンス500ms保存）
  const handleMemoChange = (value: string) => {
    setMemo(value);
    if (!user) return;
    if (memoTimerRef.current) clearTimeout(memoTimerRef.current);
    memoTimerRef.current = setTimeout(() => {
      updateYear(user.uid, Number(year), { retrospectiveMemo: value });
      memoTimerRef.current = null;
    }, 500);
  };

  // AI提案
  const handleSuggest = async (itemId: string) => {
    if (!user) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setLoadingAI((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: item.title, year, targetMonth: item.targetMonth }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = (await res.json()) as { actions: string[] };
      await updateItem(user.uid, year, itemId, { nextActions: data.actions });
    } catch (err) {
      console.error('AI suggest failed:', err);
    } finally {
      setLoadingAI((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleAdd = async (data: Omit<Item, 'id' | 'createdAt'>) => {
    if (!user) return;
    const itemId = await addItem(user.uid, year, data);
    void handleSuggest(itemId);
  };

  const handleUpdate = async (
    itemId: string,
    updates: Partial<Omit<Item, 'id' | 'createdAt'>>
  ) => {
    if (!user) return;
    await updateItem(user.uid, year, itemId, updates);
  };

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    await deleteItem(user.uid, year, itemId);
  };

  // 来年に持ち越す
  const handleCarryOver = async (item: Item) => {
    if (!user) return;
    const nextYear = String(Number(year) + 1);
    // 翌年が未作成なら自動作成（merge: true なので既存でも安全）
    await addYear(user.uid, Number(nextYear));
    // ステップはリセット（完了フラグをfalseに戻す）、ステータスは未着手に
    const resetSteps = item.steps.map((s) => ({ ...s, completed: false }));
    await addItem(user.uid, nextYear, {
      title: item.title,
      category: item.category,
      status: 'notStarted',
      targetMonth: item.targetMonth,
      steps: resetSteps,
      nextActions: undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400 text-sm">読み込み中...</span>
      </div>
    );
  }

  const total = items.length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const categories = Array.from(new Set(items.map((i) => i.category))) as Category[];

  const tabs: { id: View; label: string }[] = [
    { id: 'list',          label: 'リスト' },
    { id: 'timeline',      label: 'タイムライン' },
    { id: 'retrospective', label: '振り返り' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-16">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/years')}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
        >
          ← 年一覧
        </button>
        <h1 className="text-xl font-bold text-gray-900">{year}年</h1>
      </div>

      {/* 年間サマリー（振り返りタブ以外で表示） */}
      {total > 0 && view !== 'retrospective' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">達成率</span>
            <span className="text-lg font-bold text-gray-900">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gray-800 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">{completed} / {total} 件完了</p>

          {/* カテゴリ別達成率 */}
          {categories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const catItems = items.filter((i) => i.category === cat);
                const catCompleted = catItems.filter((i) => i.status === 'completed').length;
                const catPct =
                  catItems.length === 0
                    ? 0
                    : Math.round((catCompleted / catItems.length) * 100);
                const { bg, text, bar } = CATEGORY_COLORS[cat];
                return (
                  <div key={cat} className={`rounded-xl px-3 py-2 ${bg}`}>
                    <p className={`text-xs font-medium ${text} mb-1`}>
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full ${bar} rounded-full`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    <p className={`text-xs ${text} opacity-70`}>{catPct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {view === 'list' && (
        <ListView
          items={items}
          isLoadingAI={loadingAI}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onSuggest={handleSuggest}
        />
      )}
      {view === 'timeline' && <TimelineView items={items} />}
      {view === 'retrospective' && (
        <RetrospectiveView
          year={year}
          items={items}
          memo={memo}
          onMemoChange={handleMemoChange}
          onCarryOver={handleCarryOver}
        />
      )}
    </div>
  );
}
