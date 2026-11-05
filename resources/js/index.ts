/**
 * javaabu/block-editor's TypeScript, imported by apps as `@javaabu/block-editor`
 * through javaabu/manifest. React components are in `@javaabu/block-editor/react`.
 */
export { createBlockEditor, defaultConfig, type BlockEditorInstance, type BlockEditorOptions } from "./editor/create"
export { defineBlock, registerBlock, forgetBlock, getBlock, registeredBlocks } from "./registry"
export type {
  BlockDefinition,
  BlockRenderProps,
  ExtensionContext,
  InsertContext,
  MenuItem,
  Translate,
} from "./registry"
export { registerEmbedProvider, forgetEmbedProvider, toEmbedUrl, type EmbedProvider } from "./embeds"
export { isSafeUrl, isSafeImageUrl } from "./url"
export { detectDirection, resolveDirection, directionOf } from "./direction"
export { translator } from "./strings"
export { parseContent, fitToSchema, isEmptyDocument } from "./editor/content"
export {
  blockAt,
  currentBlock,
  insertBlock,
  moveBlock,
  duplicateBlock,
  deleteBlock,
  type BlockRef,
} from "./editor/commands"
export { atomView, settingsPrompt, openSettings } from "./editor/node-view"
export { attributesFrom, dataAttrs, defaultAttrs, insertDefault, columnsTemplate, CORE_BLOCKS } from "./blocks"
export type * from "./types"
export type { Editor, JSONContent } from "@tiptap/core"
