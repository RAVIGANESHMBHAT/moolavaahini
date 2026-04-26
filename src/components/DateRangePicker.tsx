'use client'

import { useState } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function startDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0 = Sun
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseISO(s: string): { year: number; month: number; day: number } {
  const [y, m, d] = s.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function cmp(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ── DateRangePicker ───────────────────────────────────────────────────────────

interface Props {
  from: string   // YYYY-MM-DD
  to: string     // YYYY-MM-DD
  maxDate?: string
  onChange: (from: string, to: string) => void
}

export default function DateRangePicker({ from, to, maxDate, onChange }: Props) {
  const today = maxDate ?? (() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  })()
  const todayParsed = parseISO(today)

  // The calendar shows one month at a time; start showing the month of `from`
  const fromParsed = parseISO(from)
  const [viewYear, setViewYear] = useState(fromParsed.year)
  const [viewMonth, setViewMonth] = useState(fromParsed.month)

  // During selection: after user clicks first day, pendingFrom holds it until second click
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  // For hover highlight
  const [hover, setHover] = useState<string | null>(null)

  const [open, setOpen] = useState(false)

  const days = daysInMonth(viewYear, viewMonth)
  const startDay = startDayOfMonth(viewYear, viewMonth) // 0-6

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
    // Don't navigate past today's month
    if (nextY > todayParsed.year || (nextY === todayParsed.year && nextM > todayParsed.month)) return
    setViewMonth(nextM)
    setViewYear(nextY)
  }

  function handleDayClick(dateStr: string) {
    if (dateStr > today) return
    if (pendingFrom === null) {
      // First click — set pending start
      setPendingFrom(dateStr)
    } else {
      // Second click — finalize range
      const [a, b] = cmp(pendingFrom, dateStr) <= 0
        ? [pendingFrom, dateStr]
        : [dateStr, pendingFrom]
      setPendingFrom(null)
      setHover(null)
      onChange(a, b)
      setOpen(false)
    }
  }

  function getEffectiveFrom() {
    return pendingFrom ?? from
  }

  function getEffectiveTo() {
    if (pendingFrom !== null && hover !== null) {
      return cmp(pendingFrom, hover) <= 0 ? hover : pendingFrom
    }
    return to
  }

  function getEffectiveRangeFrom() {
    if (pendingFrom !== null && hover !== null) {
      return cmp(pendingFrom, hover) <= 0 ? pendingFrom : hover
    }
    return pendingFrom ?? from
  }

  function isDayDisabled(dateStr: string) {
    return dateStr > today
  }

  function getDayState(dateStr: string): 'selected-start' | 'selected-end' | 'in-range' | 'outside' | 'disabled' | 'normal' {
    if (isDayDisabled(dateStr)) return 'disabled'
    const effectiveFrom = getEffectiveRangeFrom()
    const effectiveTo = getEffectiveTo()
    if (dateStr === effectiveFrom && dateStr === effectiveTo) return 'selected-start'
    if (dateStr === effectiveFrom) return 'selected-start'
    if (dateStr === effectiveTo) return 'selected-end'
    if (cmp(dateStr, effectiveFrom) > 0 && cmp(dateStr, effectiveTo) < 0) return 'in-range'
    return 'normal'
  }

  // Format display
  function fmtDisplay(d: string) {
    const { year, month, day } = parseISO(d)
    return `${MONTH_NAMES[month].slice(0, 3)} ${day}, ${year}`
  }

  const isNextDisabled =
    viewYear > todayParsed.year ||
    (viewYear === todayParsed.year && viewMonth >= todayParsed.month)

  return (
    <div className="relative inline-block">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setPendingFrom(null); setHover(null) }}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-saffron-500"
      >
        <svg className="h-4 w-4 text-tx3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clipRule="evenodd" />
        </svg>
        <span>{fmtDisplay(from)}</span>
        <span className="text-tx3">→</span>
        <span>{fmtDisplay(to)}</span>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setPendingFrom(null) }} />

          <div className="absolute left-0 top-full z-20 mt-1 rounded-xl border border-border bg-surface shadow-lg p-4 w-[280px]">
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="rounded p-1 text-tx3 hover:bg-surface-2 hover:text-tx transition-colors"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-tx">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                disabled={isNextDisabled}
                className="rounded p-1 text-tx3 hover:bg-surface-2 hover:text-tx transition-colors disabled:opacity-30 disabled:cursor-default"
              >
                ›
              </button>
            </div>

            {/* Day of week headers */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {DAY_LABELS.map(d => (
                <span key={d} className="text-[10px] font-medium text-tx4 py-0.5">{d}</span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: startDay }).map((_, i) => (
                <span key={`e${i}`} />
              ))}

              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1
                const dateStr = toISO(viewYear, viewMonth, day)
                const state = getDayState(dateStr)
                const isStart = state === 'selected-start'
                const isEnd = state === 'selected-end'
                const isRange = state === 'in-range'
                const isDisabled = state === 'disabled'
                const isPending = pendingFrom === dateStr

                return (
                  <div
                    key={day}
                    className={`relative flex items-center justify-center ${isRange ? 'bg-saffron-100 dark:bg-saffron-900/30' : ''}`}
                  >
                    <button
                      disabled={isDisabled}
                      onClick={() => handleDayClick(dateStr)}
                      onMouseEnter={() => pendingFrom !== null && setHover(dateStr)}
                      onMouseLeave={() => pendingFrom !== null && setHover(null)}
                      className={[
                        'relative z-10 h-8 w-8 rounded-full text-xs font-medium transition-colors',
                        isDisabled
                          ? 'cursor-default text-tx4'
                          : isStart || isEnd || isPending
                            ? 'bg-saffron-600 text-white hover:bg-saffron-700'
                            : isRange
                              ? 'text-tx hover:bg-saffron-200 dark:hover:bg-saffron-800/50'
                              : 'text-tx hover:bg-surface-2',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Hint */}
            <p className="mt-3 text-center text-[10px] text-tx4">
              {pendingFrom !== null ? 'Click end date' : 'Click start date'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
