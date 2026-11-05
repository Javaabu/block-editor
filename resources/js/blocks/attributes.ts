import type { Attributes } from "@tiptap/core"

import type { BlockConfig } from "../types"

/** Reads the attributes a node rendered into `data-attrs`, for copy and paste. */
export function readDataAttrs(element: HTMLElement): Record<string, unknown> {
  try {
    const parsed = JSON.parse(element.getAttribute("data-attrs") ?? "{}") as unknown
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * TipTap attributes from a block's config: each with its default, parsed back from
 * `data-attrs`, and never rendered on their own (the node renders `data-attrs`).
 */
export function attributesFrom(block: BlockConfig | undefined): Attributes {
  const attributes: Attributes = {}
  for (const [name, attribute] of Object.entries(block?.attributes ?? {})) {
    attributes[name] = {
      default: attribute.default ?? null,
      rendered: false,
      parseHTML: (element) => readDataAttrs(element)[name] ?? attribute.default ?? null,
    }
  }
  return attributes
}

export function dataAttrs(name: string, attrs: Record<string, unknown>): Record<string, string> {
  return { "data-block": name, "data-attrs": JSON.stringify(attrs) }
}
