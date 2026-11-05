import type { Translate } from "../registry"
import type { EditorConfig } from "../types"

/** Shared state of a block editor, on `editor.storage.blockEditor`. */
export interface BlockEditorStorage {
  config: EditorConfig
  t: Translate
  /** Opens the settings panel of the block at a position (set by the UI). */
  openSettings?: (pos: number) => void
}

declare module "@tiptap/core" {
  interface Storage {
    blockEditor: BlockEditorStorage
  }
}
