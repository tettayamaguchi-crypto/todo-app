'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { subscribeYears, subscribeItems, addYear } from '@/lib/firestore';
import { YearDoc, Item } from '@/types';
import YearCard from '@/components/YearCard';

export default function YearsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<YearDoc[]>([]);
  // items per year for progress display
  const [itemsMap, setItemsMap] = useState<Record<string, Item[]>>({});
  const [showAddYear, setShowAddYear] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/');
        return;
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;
    return subscribeYears(user.uid, setYears);
  }, [user]);

  // Subscribe to items for each year to compute progress
  useEffect(() => {
    if (!user || years.length === 0) return;
    const unsubs: Array<() => void> = years.map((y) =>
      subscribeItems(user.uid, y.id, (items) => {
        setItemsMap((prev) => ({ ...prev, [y.id]: items }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [user, years]);

  const currentYear = new Date().getFullYear();
  const existingYears = new Set(years.map((y) => y.year));
  // 選択可能な年: 過去5年 〜 10年後（未追加のもの）
  const selectableYears = Array.from(
    { length: 16 },
    (_, i) => currentYear - 5 + i
  ).filter((y) => !existingYears.has(y));

  const handleAddYear = async (year: number) => {
    if (!user) return;
    setShowAddYear(false);
    await addYear(user.uid, year);
    router.push(`/years/${year}`);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400 text-sm">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">ことしやるぞ</h1>
        <div className="flex items-center gap-2">
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'ユーザー'}
              className="w-7 h-7 rounded-full"
            />
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 年カードグリッド */}
      {years.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-6">まだ年が登録されていません</p>
          <button
            onClick={() => setShowAddYear(true)}
            className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            最初の年を追加する
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {years.map((yearDoc) => {
            const items = itemsMap[yearDoc.id] ?? [];
            return (
              <YearCard
                key={yearDoc.id}
                yearDoc={yearDoc}
                total={items.length}
                completed={items.filter((i) => i.status === 'completed').length}
                onClick={() => router.push(`/years/${yearDoc.year}`)}
              />
            );
          })}
        </div>
      )}

      {/* 年を追加ボタン */}
      {years.length > 0 && (
        <button
          onClick={() => setShowAddYear(true)}
          className="w-full py-3.5 border border-dashed border-gray-200 text-gray-400 text-sm rounded-2xl hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          ＋ 新しい年を追加
        </button>
      )}

      {/* 年選択モーダル */}
      {showAddYear && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowAddYear(false)}
          />
          <div className="relative w-full sm:max-w-xs bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">年を追加</h2>
            {selectableYears.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                追加できる年がありません
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {selectableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleAddYear(year)}
                    className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors ${
                      year === currentYear
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {year} 年{year === currentYear ? '（今年）' : ''}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddYear(false)}
              className="mt-3 w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
