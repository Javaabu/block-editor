/**
 * Embed providers, matching the PHP Embed block: a link becomes an https URL to
 * frame, or `null`. YouTube (youtube-nocookie.com) and Vimeo are built in.
 */

export type EmbedProvider = (url: string) => string | null

const providers = new Map<string, EmbedProvider>()

function parse(url: string): { host: string; path: string; query: URLSearchParams } | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
  return {
    host: parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, ""),
    path: parsed.pathname,
    query: parsed.searchParams,
  }
}

export const youtube: EmbedProvider = (url) => {
  const parts = parse(url)
  if (!parts) return null
  let id: string | null | undefined = null
  if (parts.host === "youtu.be") id = parts.path.slice(1)
  if (parts.host === "youtube.com" || parts.host === "youtube-nocookie.com") {
    id = parts.query.get("v") ?? /^\/(?:embed|shorts|live)\/([^/?#]+)/.exec(parts.path)?.[1] ?? ""
  }
  return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

export const vimeo: EmbedProvider = (url) => {
  const parts = parse(url)
  if (!parts || (parts.host !== "vimeo.com" && parts.host !== "player.vimeo.com")) return null
  const id = /(?:^|\/)(\d{4,12})(?:$|\/)/.exec(parts.path)?.[1]
  return id ? `https://player.vimeo.com/video/${id}` : null
}

providers.set("youtube", youtube)
providers.set("vimeo", vimeo)

/** Adds a provider. Register the same one in PHP with `Embed::provider()`. */
export function registerEmbedProvider(name: string, provider: EmbedProvider): void {
  providers.set(name, provider)
}

export function forgetEmbedProvider(name: string): void {
  providers.delete(name)
}

/** The URL to frame for a link, or `null` when no provider knows it. */
export function toEmbedUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null
  for (const provider of providers.values()) {
    const embed = provider(url)
    if (embed && embed.startsWith("https://")) return embed
  }
  return null
}
