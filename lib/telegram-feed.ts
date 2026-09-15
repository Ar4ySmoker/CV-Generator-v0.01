import * as cheerio from "cheerio"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export interface TelegramPost {
  id: string
  channel: string
  text: string
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
    const html = $el.find(".tgme_widget_message_text").html() ?? ""
    const text = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>|<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&#x27;/gi, "'")
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
