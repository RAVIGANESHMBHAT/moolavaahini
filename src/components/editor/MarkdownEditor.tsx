'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/theme'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  height?: number
  error?: boolean
}

export function MarkdownEditor({ value, onChange, height = 400, error }: MarkdownEditorProps) {
  const { theme } = useTheme()

  return (
    <div data-color-mode={theme} className={error ? 'rounded-lg ring-1 ring-red-500' : undefined}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        height={height}
        preview="edit"
        className={error ? 'rounded-lg border border-red-500' : 'rounded-lg border border-border2'}
      />
    </div>
  )
}
