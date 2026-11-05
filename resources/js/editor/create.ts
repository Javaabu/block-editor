import { Editor, Extension, type AnyExtension, type Range } from "@tiptap/core"

import { registerCoreBlocks } from "../blocks"
import dv from "../generated/config.dv.json"
import en from "../generated/config.en.json"
import type { MenuItem, Translate } from "../registry"
import { translator } from "../strings"
import type { ContentErrors, EditorConfig, JSONDocument, ThaanaConfig } from "../types"
import { currentBlock, moveBlock } from "./commands"
import { fitToSchema, parseContent } from "./content"
import { BlockErrors, blockErrorsKey } from "./errors"
import { insertItem, menuItems } from "./menu-items"
import { buildExtensions } from "./schema"
import { SlashMenu } from "./slash"
import { h, isRtl, uid } from "./ui/dom"
import { createBlockHandle } from "./ui/handle"
import { createLinkPopover } from "./ui/link"
import { createSettingsPanel } from "./ui/settings"
import { createToolbar } from "./ui/toolbar"

registerCoreBlocks()

const DEFAULT_CONFIGS: Record<string, EditorConfig> = {
  en: en as unknown as EditorConfig,
  dv: dv as unknown as EditorConfig,
}

/** The built-in config (the PHP default profile) in English or Dhivehi. */
export function defaultConfig(locale = "en"): EditorConfig {
  return DEFAULT_CONFIGS[locale] ?? DEFAULT_CONFIGS.en!
}

export interface BlockEditorOptions {
  /** The editor config from PHP (`BlockEditor::editorConfig()`). Default: the built-in one for `locale`. */
  config?: EditorConfig | string | null
  /** Locale of the built-in config, when there's no `config`. */
  locale?: string
  /** Initial content: TipTap JSON or a JSON string. */
  content?: JSONDocument | string | null
  /** Called with the document on every change. */
  onChange?: (value: JSONDocument, editor: Editor) => void
  editable?: boolean
  /** Thaana typing: `false` to turn it off, or settings over the config's. */
  thaana?: boolean | ThaanaConfig
  /** Validation errors to show on blocks (Laravel's error bag for the field). */
  errors?: ContentErrors | null
  /** The field name the error keys start with (`body` for `body.content.2.attrs.url`). */
  errorPrefix?: string
  /** Show the formatting toolbar. Default true. */
  toolbar?: boolean
  /** Attributes for the editable element (id, aria-labelledby, aria-describedby, aria-invalid, …). */
  attributes?: Record<string, string | undefined>
  /** Extra TipTap extensions. */
  extensions?: AnyExtension[]
  autofocus?: boolean | "start" | "end"
  /** Called once the editor exists. */
  onReady?: (instance: BlockEditorInstance) => void
}

export interface BlockEditorInstance {
  editor: Editor
  /** The editor's outer element. */
  element: HTMLElement
  config: EditorConfig
  t: Translate
  getJSON: () => JSONDocument
  /** Replaces the content (without calling onChange unless `emit`). */
  setContent: (content: JSONDocument | string | null, emit?: boolean) => void
  setErrors: (errors: ContentErrors | null | undefined, prefix?: string) => void
  setEditable: (editable: boolean) => void
  focus: () => void
  destroy: () => void
}

function resolveConfig(options: BlockEditorOptions): EditorConfig {
  const { config } = options
  if (typeof config === "string" && config.trim()) return JSON.parse(config) as EditorConfig
  if (config && typeof config === "object") return config
  return defaultConfig(options.locale)
}

/**
 * Creates a block editor inside an element: toolbar, the blocks, the "/" menu, the
 * block handle and the settings panel. Framework-free; the React component and the
 * Blade entry are thin wrappers around it.
 */
export function createBlockEditor(target: HTMLElement, options: BlockEditorOptions = {}): BlockEditorInstance {
  const config = resolveConfig(options)
  const t = translator(config.strings, defaultConfig("en").strings)
  const thaana: ThaanaConfig | false =
    options.thaana === false || config.thaana?.enabled === false
      ? false
      : { ...config.thaana, ...(typeof options.thaana === "object" ? options.thaana : {}) }

  const live = h("div", { class: "be-sr-only", "aria-live": "polite" })
  const body = h("div", { class: "be-body" })
  const root = h("div", { class: "be-editor", "data-profile": config.profile }, body, live)
  target.append(root)

  const announce = (message: string) => {
    live.textContent = ""
    window.setTimeout(() => (live.textContent = message), 30)
  }
  const rtl = () => isRtl(root)

  let toolbar: ReturnType<typeof createToolbar> | null = null
  let handle: ReturnType<typeof createBlockHandle> | null = null
  const items = (): MenuItem[] => menuItems(config, t)
  const openSettings = (pos: number) => settings.open(pos)
  const insert = (item: MenuItem) => insertItem(editor, item, openSettings)

  const contentId = options.attributes?.id ?? uid("be-content")
  const syncThaana = () => {
    const on = !!editor.storage.thaanaKeyboard?.enabled
    const dom = editor.view.dom
    if (on) {
      dom.setAttribute("lang", "dv")
      dom.setAttribute("dir", "rtl")
    } else {
      dom.removeAttribute("lang")
      dom.removeAttribute("dir")
    }
    root.toggleAttribute("data-thaana", on)
    toolbar?.update()
  }

  const shortcuts = Extension.create({
    name: "blockEditorShortcuts",
    addKeyboardShortcuts() {
      return {
        "Mod-k": () => {
          if (!config.marks.some((mark) => mark.name === "link")) return false
          link.open(null)
          return true
        },
        "Alt-F10": () => {
          toolbar?.focus()
          return !!toolbar
        },
        "Mod-Shift-ArrowUp": ({ editor: e }) => {
          const ref = currentBlock(e.state)
          const index = ref ? moveBlock(e, ref, -1) : null
          if (index !== null) announce(t("blockMoved", { position: index + 1 }))
          return true
        },
        "Mod-Shift-ArrowDown": ({ editor: e }) => {
          const ref = currentBlock(e.state)
          const index = ref ? moveBlock(e, ref, 1) : null
          if (index !== null) announce(t("blockMoved", { position: index + 1 }))
          return true
        },
        Enter: ({ editor: e }) => {
          const { selection } = e.state
          const node = "node" in selection ? (selection.node as { isAtom?: boolean } | undefined) : undefined
          if (!node?.isAtom) return false
          return settings.open(selection.from)
        },
      }
    },
  })

  const extensions: AnyExtension[] = [
    ...buildExtensions({ config, t, thaana, onThaanaToggle: () => queueMicrotask(syncThaana) }),
    BlockErrors,
    SlashMenu.configure({
      items,
      root: () => root,
      rtl,
      onChoose: (e: Editor, item: MenuItem, range: Range) => {
        e.chain().focus().deleteRange(range).run()
        insert(item)
        announce(t("blockInserted", { block: item.title }))
      },
    }),
    shortcuts,
    ...(options.extensions ?? []),
  ]

  let onChange = options.onChange
  const editor: Editor = new Editor({
    element: body,
    extensions,
    editable: options.editable ?? true,
    autofocus: options.autofocus ?? false,
    content: { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class: "be-content block-content",
        role: "textbox",
        "aria-multiline": "true",
        ...(options.attributes?.["aria-labelledby"] ? {} : { "aria-label": t("label") }),
        ...Object.fromEntries(Object.entries(options.attributes ?? {}).filter(([, value]) => value !== undefined)),
        id: contentId,
      } as Record<string, string>,
    },
    onUpdate: ({ editor: e }) => onChange?.(e.getJSON() as JSONDocument, e),
    onTransaction: () => {
      toolbar?.update()
      handle?.update()
    },
    onFocus: () => handle?.update(),
  })

  editor.commands.setContent(fitToSchema(parseContent(options.content), editor.schema), { emitUpdate: false })

  const settings = createSettingsPanel(editor, t, root, rtl)
  const link = createLinkPopover(editor, t, root, rtl)
  editor.storage.blockEditor.openSettings = openSettings

  if (options.toolbar !== false) {
    toolbar = createToolbar(
      editor,
      t,
      {
        openLink: (trigger) => link.open(trigger),
        openInserter: (trigger) => handle?.openInserter(trigger),
        openBlockActions: (trigger) => handle?.openActions(trigger),
      },
      { thaana: !!thaana },
    )
    root.prepend(toolbar.el)
  }
  handle = createBlockHandle(editor, t, { wrapper: body, items, insert, openSettings, announce })
  body.addEventListener("pointerleave", () => {
    if (!editor.view.hasFocus()) handle?.hide()
  })
  syncThaana()

  const instance: BlockEditorInstance = {
    editor,
    element: root,
    config,
    t,
    getJSON: () => editor.getJSON() as JSONDocument,
    setContent(content, emit = false) {
      editor.commands.setContent(fitToSchema(parseContent(content), editor.schema), { emitUpdate: emit })
    },
    setErrors(errors, prefix = options.errorPrefix ?? "") {
      editor.view.dispatch(editor.state.tr.setMeta(blockErrorsKey, { errors: errors ?? {}, prefix }))
    },
    setEditable(editable) {
      editor.setEditable(editable, false)
      root.toggleAttribute("data-readonly", !editable)
      toolbar?.el.toggleAttribute("hidden", !editable)
      if (!editable) handle?.hide()
    },
    focus: () => editor.commands.focus(),
    destroy() {
      onChange = undefined
      handle?.destroy()
      settings.destroy()
      link.destroy()
      editor.destroy()
      root.remove()
    },
  }

  if (options.editable === false) instance.setEditable(false)
  if (options.errors) instance.setErrors(options.errors)
  options.onReady?.(instance)

  return instance
}
