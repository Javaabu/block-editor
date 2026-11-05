import type { JSONNode } from "./types"

/*
 * Text direction of mixed Dhivehi and English content, as the PHP renderer resolves
 * it (Javaabu\BlockEditor\Rendering\Direction): text blocks get dir="auto"; lists,
 * quotes and tables take the direction of their first strong character.
 */

const RTL = "֐-ࣿ‏יִ-﷿ﹰ-﻿"
const LTR = "A-Za-zªµºÀ-ÖØ-öø-ʸͰ-҂Ҋ-֏ऀ-῿‎Ⰰ-﬜Ａ-Ｚａ-ｚ"
// eslint-disable-next-line no-misleading-character-class
const FIRST_STRONG = new RegExp(`[${RTL}]|[${LTR}]`)
const IS_RTL = new RegExp(`^[${RTL}]$`)

export const DIRECTIONAL_CONTAINERS = ["blockquote", "bulletList", "orderedList", "table"]

export type Direction = "ltr" | "rtl"

/** The direction of the first strong character, or `null`. */
export function detectDirection(text: string | null | undefined): Direction | null {
  const match = text ? FIRST_STRONG.exec(text) : null
  if (!match) return null
  return IS_RTL.test(match[0]) ? "rtl" : "ltr"
}

/** An explicit `dir` on the first descendant that has one, else the first strong character (code skipped). */
export function resolveDirection(node: JSONNode): Direction | null {
  for (const child of node.content ?? []) {
    if (child.type === "codeBlock") continue
    const dir = child.attrs?.dir
    if (dir === "ltr" || dir === "rtl") return dir
    if (child.type === "text") {
      const isCode = child.marks?.some((mark) => mark.type === "code")
      const detected = isCode ? null : detectDirection(child.text)
      if (detected) return detected
      continue
    }
    const resolved = resolveDirection(child)
    if (resolved) return resolved
  }
  return null
}

/** The `dir` to render for a node. */
export function directionOf(node: JSONNode): Direction | "auto" {
  const dir = node.attrs?.dir
  if (dir === "ltr" || dir === "rtl") return dir
  if (DIRECTIONAL_CONTAINERS.includes(node.type)) return resolveDirection(node) ?? "auto"
  return "auto"
}
