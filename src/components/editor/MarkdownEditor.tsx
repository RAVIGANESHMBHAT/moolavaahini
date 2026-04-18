'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/theme'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  height?: number
}

export function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
  const { theme } = useTheme()

  return (
    <div data-color-mode={theme}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        height={height}
        preview="edit"
        className="rounded-lg border border-border2"
      />
    </div>
  )
}
