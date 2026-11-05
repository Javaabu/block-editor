import { isSafeUrl } from "./url"

const DROP = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "BASE",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "NOSCRIPT",
  "TEMPLATE",
  "SVG",
  "MATH",
])
const URL_ATTRIBUTES = new Set(["href", "src", "action", "formaction", "xlink:href", "srcset", "poster"])

/**
 * Defence in depth for the HTML block in the browser: content is sanitized on the
 * server (symfony/html-sanitizer); this also drops scripts, event handlers and
 * unsafe URLs from HTML that didn't come from there (an unsaved preview). Without a
 * DOM (server rendering) the HTML is returned as is.
 */
export function cleanHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  const walk = (element: Element) => {
    for (const child of [...element.children]) {
      if (DROP.has(child.tagName.toUpperCase())) {
        child.remove()
        continue
      }
      for (const attribute of [...child.attributes]) {
        const name = attribute.name.toLowerCase()
        if (name.startsWith("on") || name === "style" || (URL_ATTRIBUTES.has(name) && !isSafeUrl(attribute.value))) {
          child.removeAttribute(attribute.name)
        }
      }
      walk(child)
    }
  }
  walk(doc.body)
  return doc.body.innerHTML
}
