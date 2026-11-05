/**
 * URL checks matching the PHP sanitizer (Javaabu\BlockEditor\Support\Url).
 */

const SCHEMES = ["http", "https", "mailto", "tel"]

/** http(s), mailto and tel links, and relative URLs. Never `javascript:` or `data:`. */
export function isSafeUrl(url: unknown, schemes: string[] = SCHEMES): url is string {
  if (typeof url !== "string") return false
  // Browsers ignore whitespace and control characters inside a scheme ("java\tscript:").
  // eslint-disable-next-line no-control-regex
  const clean = url.replace(/[\u0000- \u007f]+/g, "")
  if (!clean) return false
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(clean)
  if (!scheme) return !clean.startsWith("//") || isSafeUrl(`https:${clean}`, schemes)
  return schemes.includes(scheme[1]!.toLowerCase())
}

/** Safe links an image may load from (not mailto/tel). */
export function isSafeImageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false
  if (/^\s*(mailto|tel):/i.test(url)) return false
  return isSafeUrl(url)
}
