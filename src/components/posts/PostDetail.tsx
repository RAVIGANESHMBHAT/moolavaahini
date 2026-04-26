"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatDate } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import type { PostWithDetails } from "@/types";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface PostDetailProps {
  post: PostWithDetails;
  isAuthor?: boolean;
}

export function PostDetail({ post, isAuthor }: PostDetailProps) {
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const { theme } = useTheme();
  const t = useTranslations("post");

  const isRevealCategory = post.category.slug === "ogatu";

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="saffron">{post.community.name}</Badge>
        <Badge variant="blue">{post.category.name}</Badge>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold leading-tight text-tx sm:text-4xl">
          {post.title}
        </h1>
        {post.is_verified && (
          <Tooltip label={t("verifiedDescription")} placement="left" popupClassName="whitespace-normal w-64">
            <div className="mt-3 inline-flex cursor-default items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {t("verified")}
            </div>
          </Tooltip>
        )}
      </div>

      <div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
        {post.author.avatar_url ? (
          <Image
            src={post.author.avatar_url}
            alt={post.author.display_name ?? "Author"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-100 text-sm font-semibold text-saffron-700 dark:bg-saffron-900 dark:text-saffron-300">
            {post.author.display_name?.slice(0, 1).toUpperCase() ?? "U"}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-tx">
            {post.author.display_name ?? "Anonymous"}
            {isAuthor && <span className="ml-1.5 text-xs font-normal text-tx4">(You)</span>}
          </p>
          <time className="text-xs text-tx3" dateTime={post.created_at}>
            {formatDate(post.published_at ?? post.created_at)}
          </time>
        </div>
      </div>

      {!isRevealCategory && (
        <div className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-saffron-600 prose-a:no-underline hover:prose-a:underline dark:prose-invert">
          <MarkdownPreview
            source={post.body}
            wrapperElement={{ "data-color-mode": theme }}
            style={{ background: "transparent", color: "inherit" }}
          />
        </div>
      )}

      {isRevealCategory && post.body && (
        <div className="mt-2 rounded-xl border border-saffron-200 bg-saffron-50 p-5 dark:border-saffron-800 dark:bg-saffron-950/40">
          <p className="mb-3 text-sm font-semibold text-saffron-800 dark:text-saffron-300">
            🤔 Do you know the answer?
          </p>
          {answerRevealed ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-saffron-600 dark:text-saffron-400">
                Answer
              </p>
              <p className="text-base font-medium text-tx">{post.body}</p>
            </div>
          ) : (
            <button
              onClick={() => setAnswerRevealed(true)}
              className="rounded-lg bg-saffron-600 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-700 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:ring-offset-2"
            >
              Reveal Answer
            </button>
          )}
        </div>
      )}
    </article>
  );
}
