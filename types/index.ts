export type Period =
  | 'week'
  | 'month'
  | '3months'
  | '6months'
  | 'year'
  | 'none'
  | 'custom'; // 日付を指定

export type FilterPeriod = Period | 'all';

export interface Step {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string; // "YYYY-MM-DD"
}

export interface Todo {
  id: string;
  text: string;
  period: Period;
  customDueDate?: string; // "YYYY-MM-DD"（period === 'custom' のとき使用）
  completed: boolean;
  createdAt: number;
  nextActions?: string[];
  steps?: Step[];
}

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: '1週間' },
  { value: 'month', label: '1ヶ月' },
  { value: '3months', label: '3ヶ月' },
  { value: '6months', label: '半年' },
  { value: 'year', label: '1年' },
  { value: 'none', label: '期限なし' },
  { value: 'custom', label: '日付を指定' },
];

export const PERIOD_LABELS: Record<Period, string> = {
  week: '1週間',
  month: '1ヶ月',
  '3months': '3ヶ月',
  '6months': '半年',
  year: '1年',
  none: '期限なし',
  custom: '日付指定',
};

export const FILTER_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'all', label: 'すべて' },
  ...PERIOD_OPTIONS,
];

// 期間ごとの日数（'custom' を除く）
const PERIOD_DAYS: Record<Exclude<Period, 'none' | 'custom'>, number> = {
  week: 7,
  month: 30,
  '3months': 90,
  '6months': 180,
  year: 365,
};

/** 残り日数を返す。期限なし・custom 未設定は null */
export function getRemainingDays(
  todo: Pick<Todo, 'period' | 'createdAt' | 'customDueDate'>
): number | null {
  if (todo.period === 'none') return null;

  if (todo.period === 'custom') {
    if (!todo.customDueDate) return null;
    // 期限日の終わり（23:59:59）まで
    const dueMs = new Date(todo.customDueDate + 'T23:59:59').getTime();
    return Math.ceil((dueMs - Date.now()) / 86_400_000);
  }

  const elapsedDays = Math.floor((Date.now() - todo.createdAt) / 86_400_000);
  return PERIOD_DAYS[todo.period] - elapsedDays;
}

/** 残り日数のラベル */
export function getRemainingLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days <= 0) return '期限切れ';
  if (days === 1) return '残り1日';
  return `残り${days}日`;
}

/** 残り日数に応じた Tailwind テキストカラークラス */
export function getRemainingColor(days: number | null): string {
  if (days === null) return 'text-gray-300';
  if (days <= 0) return 'text-red-600 font-medium';
  if (days <= 3) return 'text-red-500 font-medium';
  if (days <= 7) return 'text-red-400';
  if (days <= 30) return 'text-amber-500';
  return 'text-gray-400';
}

/** カスタム日付を "M/D まで" 形式にフォーマット */
export function formatCustomDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}まで`;
}
