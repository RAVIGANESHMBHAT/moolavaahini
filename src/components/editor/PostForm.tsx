'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { MarkdownEditor } from './MarkdownEditor'
import { createPost, updatePost, submitForReview } from '@/actions/post.actions'
import { DiscardEditButton } from '@/components/dashboard/DiscardEditButton'
import type { Community, Category, Post } from '@/types'

// ── Category-specific field configs ─────────────────────────

interface FieldConfig {
  // When true: title = main content (riddle/proverb), body = secondary (answer/meaning)
  // No separate Title input is shown; the main textarea feeds `title` directly.
  titleIsMain?: boolean
  mainLabel: string
  mainPlaceholder: string
  // Secondary field label — maps to `body` when titleIsMain, otherwise unused
  secondaryLabel?: string
  secondaryPlaceholder?: string
  secondaryUseMarkdown?: boolean
  // When titleIsMain is false: body field config
  useMarkdown?: boolean
}

const CATEGORY_FIELDS: Record<string, FieldConfig> = {
  ogatu: {
    titleIsMain: true,
    mainLabel: 'Ogatu (Riddle)',
    mainPlaceholder: 'Write the riddle here...',
    secondaryLabel: 'Answer',
    secondaryPlaceholder: 'Write the answer here...',
  },
  gaade: {
    titleIsMain: true,
    mainLabel: 'Gaade (Proverb)',
    mainPlaceholder: 'Write the proverb here...',
    secondaryLabel: 'Artha (Meaning)',
    secondaryPlaceholder: 'Explain the meaning, usage, and cultural context...',
    secondaryUseMarkdown: true,
  },
  'mane-maddu': {
    mainLabel: 'Description',
    mainPlaceholder: 'Describe this home remedy...',
    useMarkdown: true,
  },
  recipe: {
    mainLabel: 'Recipe',
    mainPlaceholder: '## Ingredients\n\n- \n\n## Method\n\n1. \n\n## Notes\n\n',
    useMarkdown: true,
  },
  ritual: {
    mainLabel: 'Description',
    mainPlaceholder: 'Describe this ritual or tradition...',
    useMarkdown: true,
  },
  'gida-moolikegalu': {
    mainLabel: 'Description',
    mainPlaceholder: '## Plant\n\n\n\n## Medicinal Uses\n\n\n\n## Preparation\n\n',
    useMarkdown: true,
  },
}

const DEFAULT_FIELDS: FieldConfig = {
  mainLabel: 'Content',
  mainPlaceholder: 'Write your contribution...',
  useMarkdown: true,
}

// ── Types ────────────────────────────────────────────────────

interface PostFormProps {
  communities: Community[]
  categories: Category[]
  post?: Post
  mode: 'create' | 'edit'
  lockedCommunity?: Community | null
  pendingEditPostId?: string
}

// ── Simple plain textarea ────────────────────────────────────

function PlainTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500"
      />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────

export function PostForm({ communities, categories, post, mode, lockedCommunity, pendingEditPostId }: PostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, startSubmitTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [communityId, setCommunityId] = useState(
    post?.community_id ?? lockedCommunity?.id ?? ''
  )
  const [categoryId, setCategoryId] = useState(post?.category_id ?? '')
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const fields = selectedCategory
    ? (CATEGORY_FIELDS[selectedCategory.slug] ?? DEFAULT_FIELDS)
    : null

  const isStep1Complete = communityId && categoryId
  const isEdit = mode === 'edit'
  const isEditingApproved = isEdit && post?.status === 'approved'

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('title', title)
    fd.append('body', body)
    fd.append('community_id', communityId)
    fd.append('category_id', categoryId)
    return fd
  }

  const handleSaveDraft = () => {
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updatePost(post!.id, buildFormData())
        : await createPost(buildFormData())
      if (!result.success) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    })
  }

  const handleSubmitForReview = () => {
    setError(null)
    startSubmitTransition(async () => {
      const saveResult = isEdit
        ? await updatePost(post!.id, buildFormData())
        : await createPost(buildFormData())

      if (!saveResult.success) {
        setError(saveResult.error)
        return
      }

      const postId = isEdit ? post!.id : saveResult.id
      if (!postId) {
        setError('Failed to get post ID')
        return
      }

      const reviewResult = await submitForReview(postId)
      if (!reviewResult.success) {
        setError(reviewResult.error)
        return
      }

      router.push('/dashboard')
    })
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* ── Step 1: Community + Category ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {lockedCommunity ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Community</p>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-900">{lockedCommunity.name}</span>
              <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-700">
                selected
              </span>
            </div>
          </div>
        ) : (
          <Select
            label="Community"
            id="community"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            options={communities.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select community"
            required
          />
        )}

        <Select
          label="Category"
          id="category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            if (!isEdit) {
              setTitle('')
              setBody('')
            }
          }}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select category"
          required
        />
      </div>

      {/* ── Step 2: Content fields ── */}
      {isStep1Complete && fields && (
        <>
          {fields.titleIsMain ? (
            // Ogatu / Gaade: title = riddle/proverb (required), body = answer/meaning (optional)
            <>
              <PlainTextarea
                label={fields.mainLabel}
                id="title"
                value={title}
                onChange={setTitle}
                placeholder={fields.mainPlaceholder}
                rows={4}
                required
              />
              {fields.secondaryLabel && (
                fields.secondaryUseMarkdown ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {fields.secondaryLabel}
                    </label>
                    <MarkdownEditor value={body} onChange={setBody} height={300} />
                  </div>
                ) : (
                  <PlainTextarea
                    label={fields.secondaryLabel}
                    id="body"
                    value={body}
                    onChange={setBody}
                    placeholder={fields.secondaryPlaceholder}
                    rows={3}
                  />
                )
              )}
            </>
          ) : (
            // All other categories: title (required) + body editor (required)
            <>
              <Input
                label="Title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                required
              />
              {fields.useMarkdown ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {fields.mainLabel}
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <MarkdownEditor value={body} onChange={setBody} height={400} />
                </div>
              ) : (
                <PlainTextarea
                  label={fields.mainLabel}
                  id="body"
                  value={body}
                  onChange={setBody}
                  placeholder={fields.mainPlaceholder}
                  rows={5}
                  required
                />
              )}
            </>
          )}
        </>
      )}

      {/* ── Hint when step 1 not complete ── */}
      {!isStep1Complete && (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
          Select a community and category above to start writing.
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isStep1Complete && (
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          {isEditingApproved && (
            <p className="w-full text-xs text-gray-400">
              Saving will not affect the published version — your edit will be reviewed before going live.
            </p>
          )}
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            loading={isPending}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isEditingApproved ? 'Save Progress' : 'Save Draft'}
          </Button>
          <Button
            onClick={handleSubmitForReview}
            loading={isSubmitting}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Submit for Review
          </Button>
          {pendingEditPostId && (
            <div className="sm:ml-auto">
              <DiscardEditButton postId={pendingEditPostId} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
