import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Todo, Period, Step } from '@/types';

function todosRef(userId: string) {
  return collection(db, 'users', userId, 'todos');
}

export function subscribeTodos(
  userId: string,
  callback: (todos: Todo[]) => void
): () => void {
  const q = query(todosRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const todos: Todo[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        text: data.text,
        period: data.period,
        customDueDate: data.customDueDate as string | undefined,
        completed: data.completed,
        createdAt: (data.createdAt as Timestamp)?.toMillis() ?? Date.now(),
        nextActions: data.nextActions as string[] | undefined,
        steps: data.steps as Step[] | undefined,
      };
    });
    callback(todos);
  });
}

/** 追加後に AI 提案を紐付けられるよう doc ID を返す */
export async function addTodo(
  userId: string,
  text: string,
  period: Period,
  customDueDate?: string
): Promise<string> {
  const data: Record<string, unknown> = {
    text,
    period,
    completed: false,
    createdAt: serverTimestamp(),
  };
  if (customDueDate) data.customDueDate = customDueDate;

  const docRef = await addDoc(todosRef(userId), data);
  return docRef.id;
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updates: Partial<
    Pick<Todo, 'text' | 'period' | 'customDueDate' | 'completed' | 'nextActions' | 'steps'>
  >
): Promise<void> {
  const ref = doc(db, 'users', userId, 'todos', todoId);
  // undefined は Firestore が拒否するので除外する
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  await updateDoc(ref, clean);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'todos', todoId);
  await deleteDoc(ref);
}
