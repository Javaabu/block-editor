import { ICONS } from "./icons"

type Child = Node | string | number | null | undefined | false
type Attributes = Record<string, unknown>

/** Creates an element: `h("button", { type: "button", onclick: fn, "aria-label": "Bold" }, icon("bold"))`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue
    if (name.startsWith("on") && typeof value === "function") {
      element.addEventListener(name.slice(2), value as EventListener)
    } else if (name === "class") {
      element.className = String(value)
    } else if (name === "value" || name === "checked" || name === "selected") {
      ;(element as unknown as Record<string, unknown>)[name] = value
    } else {
      element.setAttribute(name, value === true ? "" : String(value))
    }
  }
  append(element, ...children)
  return element
}

export function append(element: Element, ...children: Child[]) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    element.append(child instanceof Node ? child : String(child))
  }
}

const ALIASES: Record<string, string> = {
  columns: "columns-2",
  trash: "trash-2",
  undo: "undo-2",
  redo: "redo-2",
}

/** A Lucide icon, hidden from assistive technology. Unknown names fall back to a square. */
export function icon(name: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", "2")
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("class", "be-icon")
  svg.innerHTML = ICONS[ALIASES[name] ?? name] ?? ICONS.square!
  return svg
}

let counter = 0

export function uid(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}

/** The text direction of an element (from CSS, so `dir` on any ancestor counts). */
export function isRtl(element: Element): boolean {
  const view = element.ownerDocument.defaultView
  const direction = view?.getComputedStyle(element).direction
  if (direction) return direction === "rtl"
  return element.closest("[dir]")?.getAttribute("dir") === "rtl"
}
