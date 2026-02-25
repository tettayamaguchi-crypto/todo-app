import { Category, CATEGORY_LABELS, CATEGORY_COLORS } from '@/types';

interface Props {
  category: Category;
  small?: boolean;
}

export default function CategoryTag({ category, small }: Props) {
  const { bg, text } = CATEGORY_COLORS[category];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${bg} ${text} ${
        small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
