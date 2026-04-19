import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, showCount, ...props }, ref) => {
    const valueLen = typeof props.value === 'string' ? props.value.length : 0
    const maxLen = props.maxLength

    return (
      <div className="w-full">
        {label && (
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor={id} className="block text-sm font-medium text-tx2">
              {label}
              {props.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {showCount && maxLen && (
              <span className={`text-xs ${valueLen > maxLen * 0.9 ? 'text-amber-500' : 'text-tx4'}`}>
                {valueLen}/{maxLen}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border border-border2 bg-surface px-3 py-2 text-sm text-tx',
            'placeholder:text-tx4',
            'focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/20',
            'disabled:cursor-not-allowed disabled:bg-surface2 disabled:opacity-70',
            'resize-y min-h-[120px]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

