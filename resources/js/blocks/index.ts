import { registerBlock } from "../registry"
import { button, callout, html } from "./advanced"
import { columns } from "./columns"
import { embed, image } from "./media"
import { blockquote, bulletList, codeBlock, heading, horizontalRule, orderedList, paragraph, table } from "./text"

export { button, callout, columns, embed, html, image }
export { blockquote, bulletList, codeBlock, heading, horizontalRule, orderedList, paragraph, table }
export { columnsTemplate, layoutCount, syncColumns } from "./columns"
export { defaultAttrs, insertDefault } from "./insert"
export { attributesFrom, dataAttrs, readDataAttrs } from "./attributes"
export { genericBlock } from "./generic"

export const CORE_BLOCKS = [
  paragraph,
  heading,
  bulletList,
  orderedList,
  blockquote,
  callout,
  codeBlock,
  table,
  horizontalRule,
  image,
  embed,
  button,
  columns,
  html,
]

/** Registers the core blocks (done when the package is imported). Apps replace one by registering the same name. */
export function registerCoreBlocks() {
  for (const block of CORE_BLOCKS) {
    // A block an app registered before the package loaded wins.
    if (!globalThis.__javaabuBlockEditor?.blocks.has(block.name)) registerBlock(block)
  }
}
