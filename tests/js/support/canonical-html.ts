/**
 * Serializes HTML in the canonical form of tests/Support/CanonicalHtml.php: sorted
 * attributes, normalized styles, no whitespace-only text outside <pre>.
 */
const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
])

const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const escapeAttribute = (text: string) => escapeText(text).replace(/"/g, "&quot;").replace(/'/g, "&apos;")

function style(value: string): string {
  return value
    .split(";")
    .filter((declaration) => declaration.includes(":"))
    .map((declaration) => {
      const index = declaration.indexOf(":")
      return `${declaration.slice(0, index).trim()}: ${declaration.slice(index + 1).trim()}`
    })
    .join("; ")
}

function serialize(node: Node, inPre: boolean): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ""
    if (!inPre && text.trim() === "") return ""
    return escapeText(text)
  }
  if (!(node instanceof Element)) return ""
  const tag = node.tagName.toLowerCase()
  const attributes = [...node.attributes]
    .map(
      (attribute) => [attribute.name, attribute.name === "style" ? style(attribute.value) : attribute.value] as const,
    )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  let html = `<${tag}${attributes.map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join("")}>`
  if (VOID.has(tag)) return html
  for (const child of node.childNodes) html += serialize(child, inPre || tag === "pre")
  return `${html}</${tag}>`
}

export function canonicalHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, "text/html")
  const parts = [...doc.body.childNodes].map((child) => serialize(child, false)).filter((part) => part.trim() !== "")
  return `${parts.join("\n")}\n`
}
