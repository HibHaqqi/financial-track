'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useBlur } from '@/contexts/blur-context';

interface BlurredAmountProps {
  amount: string | number;
  className?: string;
}

export function BlurredAmount({ amount, className = '' }: BlurredAmountProps) {
  const { isBlurred, toggleBlur } = useBlur();

  return (
    <div className="inline-flex items-center gap-2 group cursor-pointer" onClick={toggleBlur}>
      <span
        className={`transition-all duration-300 ${isBlurred ? 'blur-sm select-none' : ''} ${className}`}
      >
        {amount}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleBlur();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        aria-label={isBlurred ? 'Show amount' : 'Hide amount'}
      >
        {isBlurred ? (
          <Eye className="w-4 h-4 text-gray-500" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-500" />
        )}
      </button>
    </div>
  );
}
