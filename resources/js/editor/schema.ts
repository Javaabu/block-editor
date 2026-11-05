import { Extension, type AnyExtension, type Editor } from "@tiptap/core"
import { TableKit } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import { Placeholder } from "@tiptap/extensions"
import StarterKit from "@tiptap/starter-kit"
import { AutoDirection, ThaanaKeyboard } from "@javaabu/onu/editor"

import { genericBlock } from "../blocks/generic"
import { getBlock, type Translate } from "../registry"
import type { EditorConfig, ThaanaConfig } from "../types"
import { isSafeUrl } from "../url"
import type { BlockEditorStorage } from "./storage"

/** Node types that come from StarterKit and TableKit rather than a block's own extensions. */
export const KIT_NODES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
]

const TEXT_BLOCKS = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "tableCell",
  "tableHeader",
  "callout",
]

export interface SchemaOptions {
  config: EditorConfig
  t: Translate
  thaana: ThaanaConfig | false
  /** Called when Thaana typing is switched on or off. */
  onThaanaToggle?: (enabled: boolean) => void
}

/** Whether Thaana typing starts on: the config's `default_on`, else on for the dv locale. */
export function thaanaStartsOn(config: EditorConfig, thaana: ThaanaConfig | false): boolean {
  if (!thaana || thaana.enabled === false) return false
  if (typeof thaana.default_on === "boolean") return thaana.default_on
  return config.locale === "dv"
}

/** The TipTap extensions for an editor config: the profile's blocks and marks, and the shared behaviour. */
export function buildExtensions({ config, t, thaana, onThaanaToggle }: SchemaOptions): AnyExtension[] {
  const blocks = new Set(config.blocks.map((block) => block.name))
  const marks = new Set(config.marks.map((mark) => mark.name))
  const has = (name: string) => blocks.has(name)
  const headingLevels = (config.blocks.find((b) => b.name === "heading")?.attributes.level?.options ?? []).map(
    (option) => Number(option.value) as 1 | 2 | 3 | 4 | 5 | 6,
  )

  const extensions: AnyExtension[] = [
    Extension.create<Record<string, never>, BlockEditorStorage>({
      name: "blockEditor",
      addStorage: () => ({ config, t }),
    }),
    StarterKit.configure({
      heading: has("heading") ? { levels: headingLevels.length ? headingLevels : [1, 2, 3, 4, 5, 6] } : false,
      bulletList: has("bulletList") ? {} : false,
      orderedList: has("orderedList") ? {} : false,
      listItem: has("bulletList") || has("orderedList") ? {} : false,
      listKeymap: has("bulletList") || has("orderedList") ? {} : false,
      blockquote: has("blockquote") ? {} : false,
      codeBlock: has("codeBlock")
        ? { HTMLAttributes: { dir: "ltr", spellcheck: "false", class: "block-code" } }
        : false,
      horizontalRule: has("horizontalRule") ? {} : false,
      bold: marks.has("bold") ? {} : false,
      italic: marks.has("italic") ? {} : false,
      underline: marks.has("underline") ? {} : false,
      strike: marks.has("strike") ? {} : false,
      code: marks.has("code") ? { HTMLAttributes: { dir: "ltr" } } : false,
      link: marks.has("link")
        ? {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
            HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null },
            isAllowedUri: (url, context) => context.defaultValidate(url) && isSafeUrl(url),
          }
        : false,
      trailingNode: false,
      dropcursor: { class: "be-dropcursor", width: 3 },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["start", "center", "end"] }),
    AutoDirection.configure({
      types: TEXT_BLOCKS.filter((name) => KIT_NODES.includes(name) || has(name)),
    }),
    Placeholder.configure({
      showOnlyCurrent: true,
      includeChildren: true,
      placeholder: ({ node }) => {
        if (node.type.name === "heading") return t("headingPlaceholder", { level: Number(node.attrs.level ?? 1) })
        if (node.type.name === "paragraph") return t("placeholder")
        return ""
      },
    }),
  ]

  if (has("table")) extensions.push(TableKit.configure({ table: { resizable: false, renderWrapper: true } }))

  if (thaana && thaana.enabled !== false) {
    extensions.push(
      ThaanaKeyboard.configure({
        enabled: thaanaStartsOn(config, thaana),
        keymap: thaana.keymap ?? "phonetic",
        toggleShortcut: thaana.shortcut === false ? false : (thaana.shortcut ?? "Alt-Shift-t"),
        onToggle: onThaanaToggle,
      }),
    )
  }

  for (const block of config.blocks) {
    if (KIT_NODES.includes(block.name)) continue
    const definition = getBlock(block.name)
    if (definition?.extensions) {
      extensions.push(...definition.extensions({ block, config, has }))
      continue
    }
    // Child nodes of a registered block (column) come with their parent's extensions.
    if (!definition && !isChildOfDefinedBlock(block.name, config)) extensions.push(genericBlock(block))
  }

  return extensions
}

/** True when a block is a child node that its parent's JS definition creates (column, from columns). */
function isChildOfDefinedBlock(name: string, config: EditorConfig): boolean {
  return config.blocks.some(
    (parent) =>
      parent.name !== name &&
      !!getBlock(parent.name)?.extensions &&
      new RegExp(`(^|[\\s(|])${name}([\\s)|*+?{]|$)`).test(parent.content),
  )
}

/** Shortcut for the editor's shared state. */
export function storage(editor: Editor): BlockEditorStorage {
  return editor.storage.blockEditor
}
