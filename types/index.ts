export type Category =
  | 'travel'
  | 'skill'
  | 'health'
  | 'hobby'
  | 'work'
  | 'relationships'
  | 'other';

export type Status = 'notStarted' | 'inProgress' | 'completed';

export interface Step {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string; // "YYYY-MM-DD"
}

export interface Item {
  id: string;
  title: string;
  category: Category;
  status: Status;
  targetMonth?: number; // 1-12
  steps: Step[];
  nextActions?: string[];
  createdAt: number;
}

export interface YearDoc {
  id: string; // e.g. "2026"
  year: number;
  createdAt: number;
  retrospectiveMemo?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  travel: '旅行',
  skill: 'スキル',
  health: '健康',
  hobby: '趣味',
  work: '仕事',
  relationships: '人間関係',
  other: 'その他',
};

export const CATEGORY_COLORS: Record<
  Category,
  { bg: string; text: string; bar: string; border: string }
> = {
  travel:        { bg: 'bg-blue-100',   text: 'text-blue-700',   bar: 'bg-blue-400',   border: 'border-blue-200' },
  skill:         { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-400', border: 'border-purple-200' },
  health:        { bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-400',  border: 'border-green-200' },
  hobby:         { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-400', border: 'border-orange-200' },
  work:          { bg: 'bg-gray-100',   text: 'text-gray-600',   bar: 'bg-gray-400',   border: 'border-gray-200' },
  relationships: { bg: 'bg-pink-100',   text: 'text-pink-700',   bar: 'bg-pink-400',   border: 'border-pink-200' },
  other:         { bg: 'bg-slate-100',  text: 'text-slate-600',  bar: 'bg-slate-300',  border: 'border-slate-200' },
};

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'travel',        label: '旅行' },
  { value: 'skill',         label: 'スキル' },
  { value: 'health',        label: '健康' },
  { value: 'hobby',         label: '趣味' },
  { value: 'work',          label: '仕事' },
  { value: 'relationships', label: '人間関係' },
  { value: 'other',         label: 'その他' },
];

export const STATUS_LABELS: Record<Status, string> = {
  notStarted: '未着手',
  inProgress: '進行中',
  completed:  '完了',
};

export const STATUS_COLORS: Record<Status, { bg: string; text: string }> = {
  notStarted: { bg: 'bg-gray-100',  text: 'text-gray-500' },
  inProgress: { bg: 'bg-blue-50',   text: 'text-blue-600' },
  completed:  { bg: 'bg-green-50',  text: 'text-green-600' },
};

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'notStarted', label: '未着手' },
  { value: 'inProgress', label: '進行中' },
  { value: 'completed',  label: '完了' },
];

export const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];
