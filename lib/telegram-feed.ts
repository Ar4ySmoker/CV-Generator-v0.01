import * as cheerio from "cheerio"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export interface TelegramSegment {
  text: string
  url: string | null
}

export interface TelegramPost {
  id: string
  channel: string
  text: string
  segments: TelegramSegment[]
  url: string
  postedAt: string | null
}

const cache = new Map<string, { posts: TelegramPost[]; at: number }>()
const TTL = 5 * 60 * 1000

export function normalizeChannelUsername(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\/(s\/)?/, "")
    .replace(/^t\.me\/(s\/)?/, "")
    .replace(/\/$/, "")
}

function extractSegments(
  $: cheerio.CheerioAPI,
  $text: cheerio.Cheerio<import("domhandler").AnyNode>
): TelegramSegment[] {
  const segments: TelegramSegment[] = []
  $text.contents().each((_, node) => {
    if (node.type === "text") {
      segments.push({ text: node.data, url: null })
    } else if (node.type === "tag") {
      if (node.name === "br") {
        segments.push({ text: "\n", url: null })
      } else if (node.name === "a") {
        const href = ($(node).attr("href") ?? "").trim()
        segments.push({ text: $(node).text(), url: href || null })
      } else {
        segments.push({ text: $(node).text(), url: null })
      }
    }
  })
  return segments
}

export async function fetchChannelPosts(
  channel: string,
  force = false
): Promise<TelegramPost[]> {
  if (!force) {
    const cached = cache.get(channel)
    if (cached && Date.now() - cached.at < TTL) return cached.posts
  }

  const res = await fetch(`https://t.me/s/${channel}`, {
    headers: { "User-Agent": UA },
  })
  if (!res.ok) {
    throw new Error(`Канал @${channel} недоступен (HTTP ${res.status})`)
  }
  const html = await res.text()
  const $ = cheerio.load(html)

  const posts: TelegramPost[] = []
  $(".tgme_widget_message").each((_, el) => {
    const $el = $(el)
    const $text = $el.find(".tgme_widget_message_text")
    if ($text.length === 0) return

    const segments = extractSegments($, $text)
    const text = segments
      .map((s) => s.text)
      .join("")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    if (!text) return

    const link = $el.find("a.tgme_widget_message_date")
    const href = link.attr("href") ?? ""
    const postedAt = link.find("time").attr("datetime") ?? null
    const url = href
      ? href.startsWith("http")
        ? href
        : `https://t.me${href}`
      : `https://t.me/s/${channel}`
    posts.push({
      id: href || `${channel}-${posts.length}`,
      channel,
      text,
      segments,
      url,
      postedAt,
    })
  })

  cache.set(channel, { posts, at: Date.now() })
  return posts
}

export async function getFeedPosts(
  channels: string[],
  force = false
): Promise<{ posts: TelegramPost[]; errors: { channel: string; error: string }[] }> {
  const results = await Promise.allSettled(
    channels.map((c) => fetchChannelPosts(c, force))
  )

  const posts: TelegramPost[] = []
  const errors: { channel: string; error: string }[] = []

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      posts.push(...r.value)
    } else {
      errors.push({
        channel: channels[i],
        error: r.reason instanceof Error ? r.reason.message : "недоступен",
      })
    }
  })

  posts.sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))

  return { posts: posts.slice(0, 100), errors }
}
