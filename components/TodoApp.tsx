'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Todo, FilterPeriod, Period, Step, getRemainingDays } from '@/types';
import { subscribeTodos, addTodo, updateTodo, deleteTodo } from '@/lib/firestore';
import PeriodFilter from './PeriodFilter';
import AddTodoForm from './AddTodoForm';
import TodoItem from './TodoItem';
import ProgressBar from './ProgressBar';

interface Props {
  user: User;
  onSignOut: () => void;
}

export default function TodoApp({ user, onSignOut }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [loadingAI, setLoadingAI] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = subscribeTodos(user.uid, setTodos);
    return unsubscribe;
  }, [user.uid]);

  // AI提案を取得して Firestore に保存
  const handleSuggest = async (todoId: string, text: string, period: Period) => {
    setLoadingAI((prev) => new Set(prev).add(todoId));
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, period }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = (await res.json()) as { actions: string[] };
      await updateTodo(user.uid, todoId, { nextActions: data.actions });
    } catch (err) {
      console.error('AI suggest failed:', err);
    } finally {
      setLoadingAI((prev) => {
        const next = new Set(prev);
        next.delete(todoId);
        return next;
      });
    }
  };

  // 追加直後に AI 提案を非同期で取得
  const handleAdd = async (text: string, period: Period, customDueDate?: string) => {
    const todoId = await addTodo(user.uid, text, period, customDueDate);
    void handleSuggest(todoId, text, period);
  };

  // ソート: 完了を下、未完了は残り日数昇順（期限なしは末尾）
  const sortTodos = (list: Todo[]) =>
    [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const da = getRemainingDays(a);
      const db_ = getRemainingDays(b);
      if (da === null && db_ === null) return b.createdAt - a.createdAt;
      if (da === null) return 1;
      if (db_ === null) return -1;
      return da - db_;
    });

  const baseTodos = filter === 'all' ? todos : todos.filter((t) => t.period === filter);
  const filteredTodos = sortTodos(baseTodos);

  const total = filteredTodos.length;
  const completedCount = filteredTodos.filter((t) => t.completed).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-16">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-base font-semibold text-gray-800">やりたいことリスト</h1>
        <div className="flex items-center gap-2">
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'ユーザー'}
              className="w-7 h-7 rounded-full"
            />
          )}
          <button
            onClick={onSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 追加フォーム */}
      <AddTodoForm onAdd={handleAdd} />

      {/* 期間フィルター */}
      <div className="mt-4 mb-4">
        <PeriodFilter current={filter} onChange={setFilter} />
      </div>

      {/* 達成率 */}
      {total > 0 && <ProgressBar total={total} completed={completedCount} />}

      {/* リスト */}
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            {filter === 'all' ? 'やりたいことを追加してみましょう' : 'この期間の項目はありません'}
          </p>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isLoadingAI={loadingAI.has(todo.id)}
              onToggle={(completed) => updateTodo(user.uid, todo.id, { completed })}
              onUpdate={(text, period, customDueDate) =>
                updateTodo(user.uid, todo.id, { text, period, customDueDate })
              }
              onDelete={() => deleteTodo(user.uid, todo.id)}
              onSuggest={() => handleSuggest(todo.id, todo.text, todo.period)}
              onStepsChange={(steps: Step[]) => updateTodo(user.uid, todo.id, { steps })}
            />
          ))
        )}
      </div>
    </div>
  );
}
