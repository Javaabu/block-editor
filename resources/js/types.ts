/**
 * The editor config: what `BlockEditor::editorConfig()` returns in PHP, passed to
 * the editor as JSON (`data-config` in Blade, the `config` prop in React).
 */

export interface AttributeOption {
  value: string
  label: string
}

export type AttributeType = "string" | "text" | "url" | "integer" | "number" | "boolean" | "enum" | "json"

export type AttributeInput = "text" | "textarea" | "url" | "number" | "checkbox" | "select" | "code" | (string & {})

export interface AttributeConfig {
  type: AttributeType
  default: unknown
  /** Shown in the block's settings panel. */
  editable: boolean
  input?: AttributeInput
  label?: string
  help?: string
  required?: boolean
  thaana?: boolean
  min?: number
  max?: number
  options?: AttributeOption[]
}

export type BlockCategory = "text" | "media" | "embed" | "layout" | "advanced" | (string & {})

export interface BlockConfig {
  name: string
  title: string
  description: string
  /** Space-separated groups; `block` blocks may appear wherever blocks may. */
  group: string
  /** ProseMirror content expression; empty for a leaf block. */
  content: string
  /** Marks allowed in the block's text, or null for all. */
  marks: string[] | null
  insertable: boolean
  category: BlockCategory
  icon: string
  keywords: string[]
  attributes: Record<string, AttributeConfig>
}

export interface MarkConfig {
  name: string
  title: string
  attributes: Record<string, AttributeConfig>
}

export interface ThaanaConfig {
  enabled?: boolean
  /** Start in Thaana mode. `null` follows the locale (on for `dv`). */
  default_on?: boolean | null
  keymap?: "phonetic" | "phonetic-hh" | "typewriter"
  shortcut?: string | false
}

export type EditorStrings = Record<string, string | Record<string, string>>

export interface EditorConfig {
  version: 1
  profile: string
  locale: string
  blocks: BlockConfig[]
  marks: MarkConfig[]
  strings: EditorStrings
  thaana: ThaanaConfig
}

/** TipTap/ProseMirror JSON. */
export interface JSONNode {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

export interface JSONDocument extends JSONNode {
  type: "doc"
  content: JSONNode[]
}

/** Validation errors keyed by path in the JSON (`content.2.attrs.url`), as Laravel returns them under the field name. */
export type ContentErrors = Record<string, string[] | string>
