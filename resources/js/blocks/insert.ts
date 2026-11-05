import type { Editor } from "@tiptap/core"
import type { Attrs } from "@tiptap/pm/model"
import { TextSelection } from "@tiptap/pm/state"

import { currentBlock, insertBlock } from "../editor/commands"
import { getBlock, type InsertContext } from "../registry"

/** Default attributes of a block from the editor config, with the menu item's on top. */
export function defaultAttrs(editor: Editor, name: string, extra: Record<string, unknown> = {}): Attrs {
  const block = editor.storage.blockEditor?.config.blocks.find((b) => b.name === name)
  const attrs: Record<string, unknown> = {}
  for (const [key, attribute] of Object.entries(block?.attributes ?? {})) attrs[key] = attribute.default
  return { ...attrs, ...extra }
}

/**
 * Inserts a block the default way: a text block replaces an empty text block (or
 * goes after the current one), an atom or container is inserted and filled.
 */
export function insertDefault(editor: Editor, context: InsertContext) {
  const { item } = context
  const type = editor.schema.nodes[item.block]
  if (!type) return
  const attrs = defaultAttrs(editor, item.block, item.attrs)

  if (type.isTextblock) {
    const ref = currentBlock(editor.state)
    if (ref && ref.node.isTextblock && ref.node.content.size === 0) {
      const tr = editor.state.tr.setNodeMarkup(ref.pos, type, attrs)
      tr.setSelection(TextSelection.near(tr.doc.resolve(ref.pos + 1)))
      editor.view.dispatch(tr)
      editor.view.focus()
      return
    }
    insertBlock(editor, type.create(attrs))
    return
  }

  const node = type.isAtom ? type.create(attrs) : type.createAndFill(attrs)
  if (!node) return
  const pos = insertBlock(editor, node)
  if (getBlock(item.block)?.settingsOnInsert) context.openSettings(pos)
}

/**
 * Runs a command on the current text block, after making room when the selection
 * isn't in an empty one (so "/" on a filled line doesn't convert that line).
 */
export function onEmptyTextblock(editor: Editor, run: (editor: Editor) => void) {
  const ref = currentBlock(editor.state)
  if (!ref || !ref.node.isTextblock || ref.node.content.size > 0) {
    insertBlock(editor, editor.schema.nodes.paragraph!.create(), ref)
  }
  run(editor)
}
