import { Extension } from "@tiptap/core"
import type { Node as PMNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

import type { ContentErrors } from "../types"
import { posAtPath } from "./commands"

export const blockErrorsKey = new PluginKey<ErrorState>("blockEditorErrors")

interface BlockError {
  from: number
  node: PMNode
  messages: string[]
}

interface ErrorState {
  errors: BlockError[]
  decorations: DecorationSet
}

/**
 * The node path of an error key: `content.2.content.0.attrs.url` → [2, 0]. The
 * field name prefix (`body.`) must already be removed.
 */
export function errorPath(key: string): number[] | null {
  const parts = key.split(".")
  const path: number[] = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== "content") break
    const index = parts[i + 1]
    if (index === undefined || !/^\d+$/.test(index)) break
    path.push(Number(index))
    i++
  }
  return path.length ? path : null
}

/** Groups errors by the block they're about (text and marks report on their block). */
export function resolveErrors(doc: PMNode, errors: ContentErrors, prefix = ""): BlockError[] {
  const byPos = new Map<number, BlockError>()
  for (const [key, value] of Object.entries(errors)) {
    if (prefix && !key.startsWith(`${prefix}.`)) continue
    let path = errorPath(prefix ? key.slice(prefix.length + 1) : key)
    if (!path) continue
    let found = posAtPath(doc, path)
    while (found && !found.node.isBlock && path.length > 1) {
      path = path.slice(0, -1)
      found = posAtPath(doc, path)
    }
    if (!found || !found.node.isBlock) continue
    const messages = Array.isArray(value) ? value : [value]
    const existing = byPos.get(found.pos)
    if (existing) existing.messages.push(...messages)
    else byPos.set(found.pos, { from: found.pos, node: found.node, messages: [...messages] })
  }
  return [...byPos.values()]
}

function decorate(doc: PMNode, errors: BlockError[], label: string): DecorationSet {
  return DecorationSet.create(
    doc,
    errors.flatMap((error) => {
      const to = error.from + error.node.nodeSize
      const id = `be-error-${error.from}`
      return [
        Decoration.node(error.from, to, { class: "be-has-error", "aria-invalid": "true", "aria-describedby": id }),
        Decoration.widget(
          to,
          () => {
            const el = document.createElement("div")
            el.className = "be-block-error"
            el.id = id
            el.contentEditable = "false"
            el.setAttribute("aria-label", label)
            el.textContent = error.messages.join(" ")
            return el
          },
          { side: -1, key: `${id}-${error.messages.join("|")}`, ignoreSelection: true },
        ),
      ]
    }),
  )
}

/**
 * Shows server validation errors on the blocks they're about. A block's error goes
 * away as soon as the block is edited.
 */
export const BlockErrors = Extension.create({
  name: "blockEditorErrors",

  addProseMirrorPlugins() {
    const label = this.editor.storage.blockEditor.t("errors")
    return [
      new Plugin<ErrorState>({
        key: blockErrorsKey,
        state: {
          init: () => ({ errors: [], decorations: DecorationSet.empty }),
          apply(tr, old, _oldState, newState) {
            const next = tr.getMeta(blockErrorsKey) as { errors: ContentErrors; prefix: string } | undefined
            if (next) {
              const resolved = resolveErrors(newState.doc, next.errors, next.prefix)
              return { errors: resolved, decorations: decorate(newState.doc, resolved, label) }
            }
            if (!tr.docChanged || old.errors.length === 0) return old
            const kept: BlockError[] = []
            for (const error of old.errors) {
              const mapped = tr.mapping.mapResult(error.from, 1)
              if (mapped.deleted) continue
              const now = newState.doc.nodeAt(mapped.pos)
              if (!now || !now.eq(error.node)) continue
              kept.push({ ...error, from: mapped.pos, node: now })
            }
            return { errors: kept, decorations: decorate(newState.doc, kept, label) }
          },
        },
        props: {
          decorations: (state) => blockErrorsKey.getState(state)?.decorations,
        },
      }),
    ]
  },
})
