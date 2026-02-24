'use client';

import { FilterPeriod, FILTER_OPTIONS } from '@/types';

interface Props {
  current: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
}

export default function PeriodFilter({ current, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {FILTER_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
            current === value
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
