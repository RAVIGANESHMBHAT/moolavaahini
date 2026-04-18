"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
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

  // For ogatu only: title = riddle, body = answer (hidden until revealed)
  const isRevealCategory = post.category.slug === "ogatu";

  return (
    <article className="mx-auto max-w-3xl">
      {/* Meta */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="saffron">{post.community.name}</Badge>
        <Badge variant="blue">{post.category.name}</Badge>
      </div>

      {/* Title */}
      <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
        {post.title}
      </h1>

      {/* Author */}
      <div className="mb-8 flex items-center gap-3 border-b border-gray-200 pb-6">
        {post.author.avatar_url ? (
          <Image
            src={post.author.avatar_url}
            alt={post.author.display_name ?? "Author"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-100 text-sm font-semibold text-saffron-700">
            {post.author.display_name?.slice(0, 1).toUpperCase() ?? "U"}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {post.author.display_name ?? "Anonymous"}
            {isAuthor && <span className="ml-1.5 text-xs font-normal text-gray-400">(You)</span>}
          </p>
          <time className="text-xs text-gray-500" dateTime={post.created_at}>
            {formatDate(post.published_at ?? post.created_at)}
          </time>
        </div>
      </div>

      {/* Body — hidden for ogatu (body is the answer, revealed separately) */}
      {!isRevealCategory && (
        <div className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-saffron-600 prose-a:no-underline hover:prose-a:underline">
          <MarkdownPreview
            source={post.body}
            wrapperElement={{ "data-color-mode": "light" }}
            style={{ background: "transparent", color: "inherit" }}
          />
        </div>
      )}

      {/* Reveal section for ogatu only */}
      {isRevealCategory && post.body && (
        <div className="mt-2 rounded-xl border border-saffron-200 bg-saffron-50 p-5">
          <p className="mb-3 text-sm font-semibold text-saffron-800">
            🤔 Do you know the answer?
          </p>
          {answerRevealed ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-saffron-600">
                Answer
              </p>
              <p className="text-base font-medium text-gray-900">{post.body}</p>
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
