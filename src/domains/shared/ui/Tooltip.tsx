'use client';

import type { ReactNode } from 'react';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
};

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const positionClass =
    side === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';

  return (
    <span className="group relative inline-flex items-center">
      {children}

      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute z-50 hidden min-w-max max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg',
          'group-hover:block group-focus-within:block',
          positionClass,
        ].join(' ')}
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;