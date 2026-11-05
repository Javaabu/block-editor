import type { Editor } from "@tiptap/core"
import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model"
import { NodeSelection, TextSelection, type EditorState } from "@tiptap/pm/state"

/** Nodes whose children are the blocks the handle, the menus and moving work on. */
export const BLOCK_CONTAINERS = new Set(["doc", "column"])

/** A block in a container: the top-level blocks of the document, or the blocks of a column. */
export interface BlockRef {
  /** Position before the block. */
  pos: number
  node: PMNode
  /** Index in the container. */
  index: number
  /** The container (doc or column) and its position (-1 for the doc). */
  parent: PMNode
  parentPos: number
}

function refAt($pos: ResolvedPos, depth: number): BlockRef {
  return {
    pos: $pos.before(depth + 1),
    node: $pos.node(depth + 1),
    index: $pos.index(depth),
    parent: $pos.node(depth),
    parentPos: depth === 0 ? -1 : $pos.before(depth),
  }
}

/** The block holding a position: the child of the deepest container around it. */
export function blockAt(doc: PMNode, pos: number): BlockRef | null {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)))
  for (let depth = $pos.depth - 1; depth >= 0; depth--) {
    if (BLOCK_CONTAINERS.has($pos.node(depth).type.name)) return refAt($pos, depth)
  }
  // A position between blocks, e.g. right before an atom.
  const after = $pos.nodeAfter
  if (after && BLOCK_CONTAINERS.has($pos.parent.type.name)) {
    return {
      pos: $pos.pos,
      node: after,
      index: $pos.index(),
      parent: $pos.parent,
      parentPos: $pos.depth === 0 ? -1 : $pos.before(),
    }
  }
  return null
}

/** The block holding the selection (or the selected atom). */
export function currentBlock(state: EditorState): BlockRef | null {
  const { selection } = state
  if (selection instanceof NodeSelection && BLOCK_CONTAINERS.has(selection.$from.parent.type.name)) {
    return blockAt(state.doc, selection.from)
  }
  return blockAt(state.doc, selection.from)
}

/** The position of a container's child. */
function childPos(parent: PMNode, parentPos: number, index: number): number {
  let pos = parentPos + 1
  for (let i = 0; i < index; i++) pos += parent.child(i).nodeSize
  return pos
}

/** Moves a block up (-1) or down (+1) within its container. Returns its new index, or null. */
export function moveBlock(editor: Editor, ref: BlockRef, step: -1 | 1): number | null {
  const target = ref.index + step
  if (target < 0 || target >= ref.parent.childCount) return null
  const { tr } = editor.state
  const sibling = ref.parent.child(target)
  if (step < 0) {
    const siblingPos = childPos(ref.parent, ref.parentPos, target)
    tr.delete(ref.pos, ref.pos + ref.node.nodeSize).insert(siblingPos, ref.node)
    select(tr, siblingPos, ref.node)
  } else {
    const after = ref.pos + ref.node.nodeSize + sibling.nodeSize
    tr.insert(after, ref.node).delete(ref.pos, ref.pos + ref.node.nodeSize)
    select(tr, ref.pos + sibling.nodeSize, ref.node)
  }
  editor.view.dispatch(tr.scrollIntoView())
  return target
}

/** Puts the caret in a block (or selects it when it holds no text). */
function select(tr: EditorState["tr"], pos: number, node: PMNode) {
  if (node.isAtom) tr.setSelection(NodeSelection.create(tr.doc, pos))
  else tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos + 1, tr.doc.content.size))))
}

export function duplicateBlock(editor: Editor, ref: BlockRef) {
  const end = ref.pos + ref.node.nodeSize
  const tr = editor.state.tr.insert(end, ref.node.copy(ref.node.content))
  select(tr, end, ref.node)
  editor.view.dispatch(tr.scrollIntoView())
}

export function deleteBlock(editor: Editor, ref: BlockRef) {
  const { schema } = editor.state
  const tr = editor.state.tr.delete(ref.pos, ref.pos + ref.node.nodeSize)
  // Containers need a block to type in.
  if (ref.parent.childCount === 1) tr.insert(ref.pos, schema.nodes.paragraph!.create())
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(ref.pos + 1, tr.doc.content.size))))
  editor.view.dispatch(tr.scrollIntoView())
}

/**
 * Inserts a block at the selection: in place of the current block when it's an
 * empty paragraph, else after it. Returns the new block's position.
 */
export function insertBlock(editor: Editor, node: PMNode, ref: BlockRef | null = currentBlock(editor.state)): number {
  const { tr } = editor.state
  let pos: number
  if (!ref) {
    pos = tr.doc.content.size
    tr.insert(pos, node)
  } else if (ref.node.type.name === "paragraph" && ref.node.content.size === 0) {
    pos = ref.pos
    tr.replaceWith(ref.pos, ref.pos + ref.node.nodeSize, node)
  } else {
    pos = ref.pos + ref.node.nodeSize
    tr.insert(pos, node)
  }
  if (node.isAtom) tr.setSelection(NodeSelection.create(tr.doc, pos))
  else tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)))
  editor.view.dispatch(tr.scrollIntoView())
  editor.view.focus()
  return pos
}

/** Adds an empty paragraph after a block and puts the caret in it. */
export function insertParagraphAfter(editor: Editor, ref: BlockRef) {
  const end = ref.pos + ref.node.nodeSize
  const tr = editor.state.tr.insert(end, editor.schema.nodes.paragraph!.create())
  tr.setSelection(TextSelection.create(tr.doc, end + 1))
  editor.view.dispatch(tr.scrollIntoView())
  editor.view.focus()
}

/** The position of the node at a JSON path (`content.2.content.0`), or null. */
export function posAtPath(doc: PMNode, path: number[]): { pos: number; node: PMNode } | null {
  let node = doc
  let pos = -1
  for (const index of path) {
    if (index >= node.childCount) return null
    let offset = pos + 1
    for (let i = 0; i < index; i++) offset += node.child(i).nodeSize
    pos = offset
    node = node.child(index)
  }
  return pos < 0 ? null : { pos, node }
}
