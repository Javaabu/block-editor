import type { Schema } from "@tiptap/pm/model"

import type { JSONDocument, JSONNode } from "../types"

/** Parses stored content: a JSON string, a doc node, or nothing. */
export function parseContent(value: unknown): JSONDocument | null {
  let parsed = value
  if (typeof value === "string") {
    if (!value.trim()) return null
    try {
      parsed = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!parsed || typeof parsed !== "object") return null
  const node = parsed as JSONNode
  if (node.type !== "doc") return null
  return { type: "doc", content: Array.isArray(node.content) ? node.content : [] }
}

/**
 * Drops nodes and marks the schema doesn't know, so one block from another
 * profile (or a removed block) doesn't make TipTap throw away the whole document.
 */
export function fitToSchema(doc: JSONDocument | null, schema: Schema): JSONDocument {
  const fit = (node: JSONNode): JSONNode | null => {
    if (!node || typeof node !== "object" || typeof node.type !== "string" || !schema.nodes[node.type]) return null
    if (node.type === "text" && (typeof node.text !== "string" || node.text === "")) return null
    const next: JSONNode = { ...node }
    if (Array.isArray(node.content)) next.content = node.content.map(fit).filter((child): child is JSONNode => !!child)
    if (Array.isArray(node.marks)) next.marks = node.marks.filter((mark) => !!schema.marks[mark?.type])
    return next
  }
  const content = (doc?.content ?? []).map(fit).filter((child): child is JSONNode => !!child)
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] }
}

/** True when the document has nothing but empty paragraphs. */
export function isEmptyDocument(doc: JSONDocument | null | undefined): boolean {
  if (!doc) return true
  return doc.content.every(
    (node) =>
      node.type === "paragraph" && !(node.content ?? []).some((child) => child.type === "text" && child.text?.trim()),
  )
}
