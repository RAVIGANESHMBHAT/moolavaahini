'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type TranslateResult =
  | { success: true; title: string; body: string; cached: boolean }
  | { success: false; error: string }

export async function translatePost(postId: string): Promise<TranslateResult> {
  const supabase = await createClient()

  // 1. Check cache — public RLS allows anon reads
  const { data: cached } = await supabase
    .from('post_translations')
    .select('title, body')
    .eq('post_id', postId)
    .eq('language', 'en')
    .single()

  if (cached) {
    return { success: true, title: cached.title, body: cached.body, cached: true }
  }

  // 2. Fetch the original post
  const { data: post } = await supabase
    .from('posts')
    .select('title, body, status')
    .eq('id', postId)
    .single()

  if (!post) return { success: false, error: 'Post not found' }
  if (post.status !== 'approved') {
    return { success: false, error: 'Only approved posts can be translated' }
  }

  // 3. Call Anthropic
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let translated: { title: string; body: string }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a cultural knowledge translator specializing in Kannada to English translation. Translate the following text while:
- Preserving cultural context and meaning
- Keeping untranslatable cultural terms in Kannada script with a brief English explanation in parentheses
- Maintaining Markdown formatting in the body
- Being faithful to the original intent and tone

Respond with ONLY a valid JSON object in this exact shape (no markdown code fences, no extra text):
{"title": "<translated title>", "body": "<translated body preserving markdown>"}

Title: ${post.title}

Body:
${post.body}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    translated = JSON.parse(raw)

    if (!translated.title || !translated.body) {
      throw new Error('Malformed response from model')
    }
  } catch (err) {
    console.error('[translatePost] Anthropic error:', err)
    return { success: false, error: 'Translation service unavailable. Please try again.' }
  }

  // 4. Cache in DB using service-role client (bypasses RLS insert restriction)
  const serviceSupabase = createServiceClient()

  const { error: insertError } = await serviceSupabase
    .from('post_translations')
    .upsert(
      {
        post_id: postId,
        language: 'en',
        title: translated.title,
        body: translated.body,
      },
      { onConflict: 'post_id,language' }
    )

  if (insertError) {
    // Translation succeeded even if caching failed — return it anyway
    console.error('[translatePost] Cache insert error:', insertError.message)
  }

  return { success: true, title: translated.title, body: translated.body, cached: false }
}
