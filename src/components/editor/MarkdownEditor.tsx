'use client'

import dynamic from 'next/dynamic'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  height?: number
}

export function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        height={height}
        preview="edit"
        className="rounded-lg border border-gray-300"
      />
    </div>
  )
}
