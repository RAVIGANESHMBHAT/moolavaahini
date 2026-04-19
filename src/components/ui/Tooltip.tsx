import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  label: string
  children: ReactNode
  className?: string
  popupClassName?: string
  placement?: 'left' | 'center' | 'right'
}

export function Tooltip({ label, children, className, popupClassName, placement = 'center' }: TooltipProps) {
  const tipPos =
    placement === 'left'
      ? 'left-0'
      : placement === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2'

  const arrowPos =
    placement === 'left'
      ? 'left-3'
      : placement === 'right'
      ? 'right-3'
      : 'left-1/2 -translate-x-1/2'

  return (
    <div className={cn('group/tip relative inline-flex', className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-md bg-tx px-2 py-1 text-xs font-medium text-surface opacity-0 shadow-sm transition-opacity duration-150 group-hover/tip:opacity-100',
          tipPos,
          popupClassName
        )}
      >
        {label}
        {/* arrow */}
        <div className={cn('absolute bottom-full border-4 border-transparent border-b-tx', arrowPos)} />
      </div>
    </div>
  )
}
