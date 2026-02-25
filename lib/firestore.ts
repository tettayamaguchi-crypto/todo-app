import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';
import { Item, YearDoc, Category, Status, Step } from '@/types';

function yearsRef(userId: string) {
  return collection(db, 'users', userId, 'years');
}

function itemsRef(userId: string, year: string) {
  return collection(db, 'users', userId, 'years', year, 'items');
}

// ---- Years ----

export function subscribeYears(
  userId: string,
  callback: (years: YearDoc[]) => void
): () => void {
  const q = query(yearsRef(userId), orderBy('year', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const years: YearDoc[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        year: data.year as number,
        createdAt: (data.createdAt as Timestamp)?.toMillis() ?? Date.now(),
      };
    });
    callback(years);
  });
}

export async function addYear(userId: string, year: number): Promise<void> {
  const ref = doc(db, 'users', userId, 'years', String(year));
  await setDoc(ref, { year, createdAt: serverTimestamp() }, { merge: true });
}

export async function deleteYear(userId: string, year: number): Promise<void> {
  const ref = doc(db, 'users', userId, 'years', String(year));
  await deleteDoc(ref);
}

export function subscribeYear(
  userId: string,
  year: string,
  callback: (yearDoc: YearDoc | null) => void
): () => void {
  const ref = doc(db, 'users', userId, 'years', year);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    callback({
      id: snap.id,
      year: data.year as number,
      createdAt: (data.createdAt as Timestamp)?.toMillis() ?? Date.now(),
      retrospectiveMemo: data.retrospectiveMemo as string | undefined,
    });
  });
}

export async function updateYear(
  userId: string,
  year: number,
  updates: { retrospectiveMemo?: string }
): Promise<void> {
  const ref = doc(db, 'users', userId, 'years', String(year));
  await updateDoc(ref, updates);
}

// ---- Items ----

export function subscribeItems(
  userId: string,
  year: string,
  callback: (items: Item[]) => void
): () => void {
  const q = query(itemsRef(userId, year), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items: Item[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title as string,
        category: (data.category ?? 'other') as Category,
        status: (data.status ?? 'notStarted') as Status,
        targetMonth: data.targetMonth as number | undefined,
        steps: (data.steps ?? []) as Step[],
        nextActions: data.nextActions as string[] | undefined,
        createdAt: (data.createdAt as Timestamp)?.toMillis() ?? Date.now(),
      };
    });
    callback(items);
  });
}

export async function addItem(
  userId: string,
  year: string,
  item: Omit<Item, 'id' | 'createdAt'>
): Promise<string> {
  const data: Record<string, unknown> = {
    title: item.title,
    category: item.category,
    status: item.status,
    steps: item.steps,
    createdAt: serverTimestamp(),
  };
  if (item.targetMonth !== undefined) data.targetMonth = item.targetMonth;
  const docRef = await addDoc(itemsRef(userId, year), data);
  return docRef.id;
}

export async function updateItem(
  userId: string,
  year: string,
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'years', year, 'items', itemId);
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  await updateDoc(ref, clean);
}

export async function deleteItem(
  userId: string,
  year: string,
  itemId: string
): Promise<void> {
  const ref = doc(db, 'users', userId, 'years', year, 'items', itemId);
  await deleteDoc(ref);
}
