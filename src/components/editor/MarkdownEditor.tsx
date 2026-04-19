'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'
import type { ICommand } from '@uiw/react-md-editor'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5 MB
const MAX_UPLOAD_WIDTH = 1920           // cap large images before uploading

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Replace the markdown/html image with matching src with a new <img width="X"> tag. */
function updateImageWidth(markdown: string, src: string, alt: string, newWidth: number): string {
  const tag = `<img src="${src}" alt="${alt}" width="${newWidth}" />`
  const htmlRe = new RegExp(`<img[^>]*src=["']${escapeRegex(src)}["'][^>]*/?>`, 'g')
  if (htmlRe.test(markdown)) return markdown.replace(htmlRe, tag)
  const mdRe = new RegExp(`!\\[([^\\]]*)\\]\\(${escapeRegex(src)}\\)`, 'g')
  return markdown.replace(mdRe, tag)
}

/** Resize an image file on a canvas if it exceeds maxWidth. Returns original file otherwise. */
async function maybeResize(file: File, maxWidth: number): Promise<{ blob: Blob; mime: string; ext: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const mime = file.type === 'image/png' ? 'image/png'
        : file.type === 'image/webp' ? 'image/webp'
        : 'image/jpeg'
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'

      if (img.naturalWidth <= maxWidth) {
        // No resize needed — upload original file to preserve quality
        resolve({ blob: file, mime, ext })
        return
      }
      const scale = maxWidth / img.naturalWidth
      const canvas = document.createElement('canvas')
      canvas.width = maxWidth
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        b => b ? resolve({ blob: b, mime, ext }) : reject(new Error('Canvas export failed')),
        mime, 0.88,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

// ─── Resizable image component (rendered inside the preview pane) ────────────

interface ResizableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onResize: (newWidth: number) => void
}

function ResizableImage({ src, alt, onResize, style, ...rest }: ResizableImageProps) {
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const startX = useRef(0)
  const startW = useRef(0)

  const onPointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX
    startW.current = imgRef.current?.offsetWidth ?? 200
  }
  const onPointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!(e.buttons & 1)) return
    setDragWidth(Math.max(50, Math.round(startW.current + e.clientX - startX.current)))
  }
  const onPointerUp = (e: React.PointerEvent<HTMLSpanElement>) => {
    const w = Math.max(50, Math.round(startW.current + e.clientX - startX.current))
    setDragWidth(null)
    onResize(w)
  }

  return (
    <span className="group relative inline-block leading-none">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{ ...style, width: dragWidth ?? style?.width, maxWidth: '100%', display: 'block' }}
        {...rest}
      />
      {/* Width badge visible while dragging */}
      {dragWidth && (
        <span className="pointer-events-none absolute -top-6 left-0 rounded bg-black/70 px-1.5 py-0.5 text-[10px] leading-tight text-white">
          {dragWidth} px
        </span>
      )}
      {/* Drag handle — visible on hover */}
      <span
        className="absolute bottom-0 right-0 flex h-5 w-5 cursor-se-resize touch-none items-center justify-center rounded-tl-md bg-saffron-500 opacity-0 transition-opacity group-hover:opacity-90"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg viewBox="0 0 10 10" width="8" height="8" fill="white">
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="4.5" cy="8" r="1.5" />
          <circle cx="8" cy="4.5" r="1.5" />
        </svg>
      </span>
    </span>
  )
}

// ─── Main editor component ────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  height?: number
  error?: boolean
}

export function MarkdownEditor({ value, onChange, height = 400, error }: MarkdownEditorProps) {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [defaultExtraCmds, setDefaultExtraCmds] = useState<ICommand[]>([])
  const apiRef = useRef<import('@uiw/react-md-editor').commands.TextAreaTextApi | null>(null)

  // Refs so the stable previewOptions closure always sees the latest value/onChange
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => { valueRef.current = value }, [value])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    import('@uiw/react-md-editor').then(({ commands }) => {
      setDefaultExtraCmds(commands.getExtraCommands())
    })
  }, [])

  // Stable — never recreated, so the preview never remounts mid-drag
  const previewOptions = useMemo(() => ({
    components: {
      img: ({ src, alt, node: _node, ...rest }: { src?: string; alt?: string; node?: unknown } & React.ImgHTMLAttributes<HTMLImageElement>) => (
        <ResizableImage
          src={src}
          alt={alt}
          onResize={(newWidth) => {
            if (!src) return
            onChangeRef.current(updateImageWidth(valueRef.current, src, alt ?? '', newWidth))
          }}
          {...rest}
        />
      ),
    },
  }), [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !apiRef.current) return

    setUploadError(null)
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file.'); return }
    if (file.size > MAX_FILE_SIZE) { setUploadError('Image must be 5 MB or smaller.'); return }

    setIsUploading(true)
    const uploadId = crypto.randomUUID()
    const placeholder = `![uploading](${uploadId})`
    const stateAfterInsert = apiRef.current.replaceSelection(placeholder)
    const textWithPlaceholder = stateAfterInsert.text

    try {
      const { blob, mime, ext } = await maybeResize(file, MAX_UPLOAD_WIDTH)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('post-images')
        .upload(path, blob, { contentType: mime })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(path)

      onChange(textWithPlaceholder.replace(placeholder, `![image](${publicUrl})`))
    } catch (err) {
      onChange(textWithPlaceholder.replace(placeholder, ''))
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const imageUploadCommand: ICommand = {
    name: 'imageUpload',
    keyCommand: 'imageUpload',
    buttonProps: { 'aria-label': 'Upload image', title: 'Upload image' },
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
        <path fillRule="evenodd" d="M1 5.75A2.75 2.75 0 013.75 3h12.5A2.75 2.75 0 0119 5.75v8.5A2.75 2.75 0 0116.25 17H3.75A2.75 2.75 0 011 14.25v-8.5zm1.5 0v5.56l3.22-3.22a.75.75 0 011.06 0l3.5 3.5 1.47-1.47a.75.75 0 011.06 0L16 13.44V5.75c0-.69-.56-1.25-1.25-1.25H3.75C3.06 4.5 2.5 5.06 2.5 5.75zm13.5 8.5-4.5-4.5-1.47 1.47a.75.75 0 01-1.06 0l-3.5-3.5-3 3V14.25c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-.25zM7.25 8a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" clipRule="evenodd" />
      </svg>
    ),
    execute: (_state, api) => {
      apiRef.current = api
      fileInputRef.current?.click()
    },
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div
        data-color-mode={theme}
        className={[
          error ? 'rounded-lg ring-1 ring-red-500' : '',
          isUploading ? 'cursor-wait opacity-75' : '',
        ].filter(Boolean).join(' ') || undefined}
      >
        <MDEditor
          value={value}
          onChange={(val) => onChange(val ?? '')}
          height={height}
          preview="live"
          extraCommands={[...defaultExtraCmds, imageUploadCommand]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          previewOptions={previewOptions as any}
          className={error ? 'rounded-lg border border-red-500' : 'rounded-lg border border-border2'}
        />
      </div>
      {uploadError && <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>}
    </div>
  )
}
