"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MarkdownEditor } from "./MarkdownEditor";
import {
  createPost,
  updatePost,
  submitForReview,
} from "@/actions/post.actions";
import { DiscardEditButton } from "@/components/dashboard/DiscardEditButton";
import type { Community, Category, Post } from "@/types";

interface FieldConfig {
  titleIsMain?: boolean;
  mainLabel: string;
  mainPlaceholder: string;
  secondaryLabel?: string;
  secondaryPlaceholder?: string;
  secondaryUseMarkdown?: boolean;
  useMarkdown?: boolean;
}

interface PostFormProps {
  communities: Community[];
  categories: Category[];
  post?: Post;
  mode: "create" | "edit";
  lockedCommunity?: Community | null;
  pendingEditPostId?: string;
}

interface FormErrors {
  community?: string;
  category?: string;
  title?: string;
  body?: string;
}

function PlainTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  error,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-tx2">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-tx placeholder:text-tx4 focus:outline-none focus:ring-1 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border2 focus:border-saffron-500 focus:ring-saffron-500"}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function PostForm({
  communities,
  categories,
  post,
  mode,
  lockedCommunity,
  pendingEditPostId,
}: PostFormProps) {
  const router = useRouter();
  const t = useTranslations("editor");
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const [communityId, setCommunityId] = useState(
    post?.community_id ?? lockedCommunity?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");

  const CATEGORY_FIELDS: Record<string, FieldConfig> = {
    ogatu: {
      titleIsMain: true,
      mainLabel: t("ogatu"),
      mainPlaceholder: t("ogatuPlaceholder"),
      secondaryLabel: t("answer"),
      secondaryPlaceholder: t("answerPlaceholder"),
    },
    gaade: {
      titleIsMain: true,
      mainLabel: t("gaade"),
      mainPlaceholder: t("gaadePlaceholder"),
      secondaryLabel: t("artha"),
      secondaryPlaceholder: t("arthaPlaceholder"),
      secondaryUseMarkdown: true,
    },
    "mane-maddu": {
      mainLabel: t("description"),
      mainPlaceholder: t("homeRemedyPlaceholder"),
      useMarkdown: true,
    },
    recipe: {
      mainLabel: t("recipe"),
      mainPlaceholder: t("recipePlaceholder"),
      useMarkdown: true,
    },
    ritual: {
      mainLabel: t("description"),
      mainPlaceholder: t("ritualPlaceholder"),
      useMarkdown: true,
    },
    "gida-moolikegalu": {
      mainLabel: t("description"),
      mainPlaceholder: t("plantPlaceholder"),
      useMarkdown: true,
    },
  };

  const DEFAULT_FIELDS: FieldConfig = {
    mainLabel: t("content"),
    mainPlaceholder: t("contentPlaceholder"),
    useMarkdown: true,
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const fields = selectedCategory
    ? (CATEGORY_FIELDS[selectedCategory.slug] ?? DEFAULT_FIELDS)
    : null;

  const isStep1Complete = communityId && categoryId;
  const isEdit = mode === "edit";
  const isEditingApproved = isEdit && post?.status === "approved";

  const validate = (requireBody = false): FormErrors => {
    const errors: FormErrors = {};
    if (!communityId) errors.community = t("validateCommunity");
    if (!categoryId) errors.category = t("validateCategory");
    if (!title.trim()) errors.title = t("validateRequired");
    if (requireBody && fields) {
      const bodyRequired =
        fields.secondaryLabel !== undefined || !fields.titleIsMain;
      if (bodyRequired && !body.trim()) errors.body = t("validateRequired");
    }
    return errors;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("body", body);
    fd.append("community_id", communityId);
    fd.append("category_id", categoryId);
    return fd;
  };

  const handleSaveDraft = () => {
    const errors = validate(false);
    if (errors.community || errors.category || errors.title) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setServerError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updatePost(post!.id, buildFormData())
        : await createPost(buildFormData());
      if (!result.success) setServerError(result.error);
      else router.push("/dashboard");
    });
  };

  const handleSubmitForReview = () => {
    const errors = validate(true);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setServerError(null);
    startSubmitTransition(async () => {
      const saveResult = isEdit
        ? await updatePost(post!.id, buildFormData())
        : await createPost(buildFormData());
      if (!saveResult.success) {
        setServerError(saveResult.error);
        return;
      }
      const postId = isEdit ? post!.id : saveResult.id;
      if (!postId) {
        setServerError("Failed to get post ID");
        return;
      }
      const reviewResult = await submitForReview(postId);
      if (!reviewResult.success) {
        setServerError(reviewResult.error);
        return;
      }
      router.push("/dashboard");
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {lockedCommunity ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-tx2">{t("community")}</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-2">
              <span className="text-sm text-tx">{lockedCommunity.name}</span>
              <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-700 dark:bg-saffron-900 dark:text-saffron-300">
                {t("communitySelected")}
              </span>
            </div>
          </div>
        ) : (
          <Select
            label={t("community")}
            id="community"
            value={communityId}
            onChange={(e) => {
              setCommunityId(e.target.value);
              setFieldErrors((p) => ({ ...p, community: undefined }));
            }}
            options={communities.map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t("selectCommunity")}
            required
            error={fieldErrors.community}
          />
        )}

        <Select
          label={t("category")}
          id="category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setFieldErrors((p) => ({ ...p, category: undefined }));
            if (!isEdit) {
              setTitle("");
              setBody("");
            }
          }}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder={t("selectCategory")}
          required
          error={fieldErrors.category}
        />
      </div>

      {isStep1Complete && fields && (
        <>
          {fields.titleIsMain ? (
            <>
              <PlainTextarea
                label={fields.mainLabel}
                id="title"
                value={title}
                onChange={(v) => {
                  setTitle(v);
                  setFieldErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder={fields.mainPlaceholder}
                rows={4}
                required
                error={fieldErrors.title}
              />
              {fields.secondaryLabel &&
                (fields.secondaryUseMarkdown ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-tx2">
                      {fields.secondaryLabel}
                      <span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <MarkdownEditor
                      value={body}
                      onChange={(v) => {
                        setBody(v);
                        setFieldErrors((p) => ({ ...p, body: undefined }));
                      }}
                      height={300}
                      error={!!fieldErrors.body}
                    />
                    {fieldErrors.body && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.body}
                      </p>
                    )}
                  </div>
                ) : (
                  <PlainTextarea
                    label={fields.secondaryLabel}
                    id="body"
                    value={body}
                    onChange={(v) => {
                      setBody(v);
                      setFieldErrors((p) => ({ ...p, body: undefined }));
                    }}
                    placeholder={fields.secondaryPlaceholder}
                    rows={3}
                    required
                    error={fieldErrors.body}
                  />
                ))}
            </>
          ) : (
            <>
              <Input
                label={t("title")}
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFieldErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder={t("titlePlaceholder")}
                required
                error={fieldErrors.title}
              />
              {fields.useMarkdown ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-tx2">
                    {fields.mainLabel}
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <MarkdownEditor
                    value={body}
                    onChange={(v) => {
                      setBody(v);
                      setFieldErrors((p) => ({ ...p, body: undefined }));
                    }}
                    height={400}
                    error={!!fieldErrors.body}
                  />
                  {fieldErrors.body && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.body}
                    </p>
                  )}
                </div>
              ) : (
                <PlainTextarea
                  label={fields.mainLabel}
                  id="body"
                  value={body}
                  onChange={(v) => {
                    setBody(v);
                    setFieldErrors((p) => ({ ...p, body: undefined }));
                  }}
                  placeholder={fields.mainPlaceholder}
                  rows={5}
                  required
                  error={fieldErrors.body}
                />
              )}
            </>
          )}
        </>
      )}

      {!isStep1Complete && (
        <p className="rounded-lg border border-dashed border-border2 px-4 py-6 text-center text-sm text-tx4">
          {t("selectStep1")}
        </p>
      )}

      {serverError && (
        <div className="rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
          {serverError}
        </div>
      )}

      {isStep1Complete && (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          {isEditingApproved && (
            <p className="w-full text-xs text-tx4">{t("savingNote")}</p>
          )}
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            loading={isPending}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isEditingApproved ? t("saveProgress") : t("saveDraft")}
          </Button>
          <Button
            onClick={handleSubmitForReview}
            loading={isSubmitting}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {t("submitReview")}
          </Button>
          {pendingEditPostId && (
            <div className="sm:ml-auto">
              <DiscardEditButton postId={pendingEditPostId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
