import type { Editor } from "@tiptap/core"

import { insertDefault } from "../blocks/insert"
import { getBlock, type MenuItem, type Translate } from "../registry"
import type { EditorConfig } from "../types"

/** The "/" and "+" menu entries of a config's insertable blocks, in config order. */
export function menuItems(config: EditorConfig, t: Translate): MenuItem[] {
  return config.blocks
    .filter((block) => block.insertable)
    .flatMap((block) => {
      const definition = getBlock(block.name)
      if (definition?.menuItems) return definition.menuItems(block, t)
      return [
        {
          id: block.name,
          block: block.name,
          title: block.title,
          description: block.description,
          icon: block.icon,
          keywords: block.keywords,
          category: block.category,
        },
      ]
    })
}

/** Inserts a menu item's block with its definition's insert(), or the default one. */
export function insertItem(editor: Editor, item: MenuItem, openSettings: (pos: number) => void) {
  const definition = getBlock(item.block)
  const context = { item, openSettings }
  if (definition?.insert) definition.insert(editor, context)
  else insertDefault(editor, context)
}
