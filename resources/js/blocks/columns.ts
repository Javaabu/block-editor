import { Node, type Editor } from "@tiptap/core"
import type { Node as PMNode } from "@tiptap/pm/model"

import { insertBlock } from "../editor/commands"
import { defineBlock } from "../registry"
import { attributesFrom, dataAttrs } from "./attributes"
import { defaultAttrs } from "./insert"

/** The CSS grid columns: the layout's fractions when they match the columns, else equal ones (as in PHP). */
export function columnsTemplate(layout: unknown, count: number): string {
  let fractions = String(layout ?? "1-1").split("-")
  if (fractions.length !== count) fractions = Array.from({ length: Math.max(1, count) }, () => "1")
  return fractions.map((fraction) => `minmax(0, ${fraction}fr)`).join(" ")
}

export function layoutCount(layout: unknown): number {
  return String(layout ?? "1-1").split("-").length
}

function columnsAttributes(node: PMNode): Record<string, string> {
  return {
    class: "block-columns",
    "data-stack": String(node.attrs.stackAt ?? "md"),
    "data-gap": String(node.attrs.gap ?? "md"),
    "data-align": String(node.attrs.verticalAlign ?? "stretch"),
    style: `--block-columns: ${columnsTemplate(node.attrs.layout, node.childCount)}`,
    ...dataAttrs("columns", node.attrs),
  }
}

/**
 * Makes the number of columns match the layout: adds empty columns, or moves the
 * blocks of the columns that go into the last one that stays (nothing is lost).
 */
export function syncColumns(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos)
  if (!node || node.type.name !== "columns") return
  const wanted = layoutCount(node.attrs.layout)
  const { schema } = editor.state
  const columns: PMNode[] = []
  node.forEach((column) => columns.push(column))
  if (columns.length === wanted) return

  if (columns.length < wanted) {
    while (columns.length < wanted) columns.push(schema.nodes.column!.create(null, schema.nodes.paragraph!.create()))
  } else {
    const extra = columns.splice(wanted)
    const last = columns[wanted - 1]!
    const blocks: PMNode[] = []
    last.forEach((child) => blocks.push(child))
    for (const column of extra) column.forEach((child) => blocks.push(child))
    columns[wanted - 1] = schema.nodes.column!.create(last.attrs, blocks)
  }

  const replacement = node.type.create(node.attrs, columns)
  editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + node.nodeSize, replacement))
}

export const columns = defineBlock({
  name: "columns",
  extensions: ({ block, config }) => [
    Node.create({
      name: "columns",
      group: "block",
      content: block.content || "column+",
      defining: true,
      isolating: true,
      addAttributes: () => attributesFrom(block),
      parseHTML: () => [{ tag: 'div[data-block="columns"]' }],
      renderHTML: ({ node }) => ["div", columnsAttributes(node), 0],
      addNodeView() {
        return ({ node }) => {
          const dom = document.createElement("div")
          const apply = (current: PMNode) => {
            for (const [name, value] of Object.entries(columnsAttributes(current))) dom.setAttribute(name, value)
          }
          apply(node)
          return {
            dom,
            contentDOM: dom,
            update(next) {
              if (next.type.name !== "columns") return false
              apply(next)
              return true
            },
          }
        }
      },
    }),
    Node.create({
      name: "column",
      content: config.blocks.find((b) => b.name === "column")?.content || "block+",
      defining: true,
      isolating: true,
      parseHTML: () => [{ tag: 'div[data-block="column"]' }],
      renderHTML: () => ["div", { class: "block-column", "data-block": "column" }, 0],
    }),
  ],
  insert: (editor, { item }) => {
    const { schema } = editor.state
    const attrs = defaultAttrs(editor, "columns", item.attrs)
    const count = layoutCount(attrs.layout)
    const columns = Array.from({ length: count }, () =>
      schema.nodes.column!.create(null, schema.nodes.paragraph!.create()),
    )
    const pos = insertBlock(editor, schema.nodes.columns!.create(attrs, columns))
    // Put the caret in the first column.
    editor.commands.setTextSelection(pos + 3)
  },
  afterSettingsChange: syncColumns,
})
