'use client'

import { cn } from '@/lib/utils'
import { useState, useRef, useEffect, useId } from 'react'

interface SelectProps {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  id?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function Select({ className, label, error, id: externalId, options, placeholder, value, onChange, required, disabled }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const id = externalId ?? generatedId

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optValue: string) => {
    onChange?.({ target: { value: optValue } })
    setOpen(false)
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-tx2">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div ref={ref} className="relative w-full">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-border2 bg-surface px-3 py-2 text-sm',
            'focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/20',
            'disabled:cursor-not-allowed disabled:bg-surface2 disabled:opacity-70',
            error && 'border-red-500',
            selected ? 'text-tx' : 'text-tx4',
            className
          )}
        >
          <span className="truncate">{selected ? selected.label : (placeholder ?? 'Select…')}</span>
          <svg
            className={cn('ml-2 h-4 w-4 shrink-0 text-tx4 transition-transform', open && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
            {placeholder && (
              <li className="px-3 py-2 text-sm text-tx4 cursor-default select-none">{placeholder}</li>
            )}
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  opt.value === value
                    ? 'bg-saffron-50 text-saffron-700 dark:bg-saffron-950 dark:text-saffron-300'
                    : 'text-tx hover:bg-surface2'
                )}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
