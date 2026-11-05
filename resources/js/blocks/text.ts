import { defineBlock, type MenuItem } from "../registry"
import { onEmptyTextblock } from "./insert"

/*
 * Blocks whose nodes come from TipTap's StarterKit and TableKit (configured in
 * editor/schema.ts): only their menu entries and insert commands live here.
 */

export const paragraph = defineBlock({
  name: "paragraph",
  insert: (editor) => onEmptyTextblock(editor, (e) => e.chain().focus().setParagraph().run()),
})

export const heading = defineBlock({
  name: "heading",
  menuItems: (block, t) => {
    const levels = (block.attributes.level?.options ?? []).map((option) => Number(option.value))
    return (levels.length ? levels : [1, 2, 3]).map<MenuItem>((level) => ({
      id: `heading:${level}`,
      block: "heading",
      title: t("headingLevel", { level }),
      description: block.description,
      icon: "heading",
      keywords: [...block.keywords, `h${level}`, "heading"],
      category: block.category,
      attrs: { level },
    }))
  },
  insert: (editor, { item }) =>
    onEmptyTextblock(editor, (e) =>
      e
        .chain()
        .focus()
        .setHeading({ level: Number(item.attrs?.level ?? 2) as 1 | 2 | 3 | 4 | 5 | 6 })
        .run(),
    ),
})

export const bulletList = defineBlock({
  name: "bulletList",
  insert: (editor) => onEmptyTextblock(editor, (e) => e.chain().focus().toggleBulletList().run()),
})

export const orderedList = defineBlock({
  name: "orderedList",
  insert: (editor) => onEmptyTextblock(editor, (e) => e.chain().focus().toggleOrderedList().run()),
})

export const blockquote = defineBlock({
  name: "blockquote",
  insert: (editor) => onEmptyTextblock(editor, (e) => e.chain().focus().toggleBlockquote().run()),
})

export const codeBlock = defineBlock({
  name: "codeBlock",
  insert: (editor) => onEmptyTextblock(editor, (e) => e.chain().focus().setCodeBlock().run()),
})

export const horizontalRule = defineBlock({
  name: "horizontalRule",
  insert: (editor) => onEmptyTextblock(editor, (e) => e.chain().focus().setHorizontalRule().run()),
})

export const table = defineBlock({
  name: "table",
  insert: (editor) =>
    onEmptyTextblock(editor, (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()),
})
