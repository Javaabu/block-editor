import type { Editor } from "@tiptap/core"

import type { Translate } from "../../registry"
import { h, icon, isRtl } from "./dom"

export interface ToolbarActions {
  openLink: (trigger: HTMLElement) => void
  openInserter: (trigger: HTMLElement) => void
  openBlockActions: (trigger: HTMLElement) => void
}

interface Item {
  el: HTMLElement
  update: () => void
}

const MARK_ICONS: Record<string, string> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strike: "strikethrough",
  code: "code",
}

const SHORTCUTS: Record<string, string> = {
  bold: "Mod+B",
  italic: "Mod+I",
  underline: "Mod+U",
  strike: "Mod+Shift+S",
  code: "Mod+E",
  link: "Mod+K",
  undo: "Mod+Z",
  redo: "Mod+Shift+Z",
  thaana: "Alt+Shift+T",
}

function shortcut(key: string): string | undefined {
  const keys = SHORTCUTS[key]
  if (!keys) return undefined
  const mac = typeof navigator !== "undefined" && /Mac|iP(hone|ad|od)/.test(navigator.platform)
  return keys.replace("Mod", mac ? "Meta" : "Control")
}

/**
 * The formatting toolbar: marks, link, alignment, block type, table tools, block
 * actions, history and the Thaana toggle. One tab stop; arrow keys move between
 * its controls (mirrored in RTL), as in a WAI-ARIA toolbar.
 */
export function createToolbar(editor: Editor, t: Translate, actions: ToolbarActions, options: { thaana: boolean }) {
  const { config } = editor.storage.blockEditor
  const marks = new Set(config.marks.map((mark) => mark.name))
  const blocks = new Set(config.blocks.map((block) => block.name))
  const items: Item[] = []

  const el = h("div", {
    class: "be-toolbar",
    role: "toolbar",
    "aria-label": t("toolbar"),
    "aria-controls": editor.view.dom.id || undefined,
  })

  const button = (
    key: string,
    iconName: string,
    run: (trigger: HTMLElement) => void,
    state?: () => { active?: boolean; disabled?: boolean },
    toggle = false,
  ) => {
    const label = t(key)
    const element = h(
      "button",
      {
        type: "button",
        class: "be-toolbar__button",
        "aria-label": label,
        title: label,
        "aria-keyshortcuts": shortcut(key),
        "aria-pressed": toggle ? "false" : undefined,
        tabindex: "-1",
        "data-action": key,
        onpointerdown: (event: Event) => event.preventDefault(),
        onclick: () => run(element),
      },
      icon(iconName),
    )
    items.push({
      el: element,
      update: () => {
        const current = state?.() ?? {}
        if (toggle) element.setAttribute("aria-pressed", current.active ? "true" : "false")
        element.disabled = !!current.disabled
      },
    })
    return element
  }

  const separator = (): HTMLElement =>
    h("span", { class: "be-toolbar__separator", role: "separator", "aria-orientation": "vertical" })

  const group = (...children: (HTMLElement | null)[]): HTMLElement | null => {
    const present = children.filter((child): child is HTMLElement => !!child)
    return present.length ? h("div", { class: "be-toolbar__group", role: "group" }, ...present) : null
  }

  // Block type
  const types: { value: string; label: string; run: () => void; active: () => boolean }[] = []
  if (blocks.has("paragraph")) {
    types.push({
      value: "paragraph",
      label: config.blocks.find((b) => b.name === "paragraph")!.title,
      run: () => editor.chain().focus().setParagraph().run(),
      active: () => editor.isActive("paragraph"),
    })
  }
  const levels = (config.blocks.find((b) => b.name === "heading")?.attributes.level?.options ?? []).map((o) =>
    Number(o.value),
  )
  for (const level of levels) {
    types.push({
      value: `heading:${level}`,
      label: t("headingLevel", { level }),
      run: () =>
        editor
          .chain()
          .focus()
          .setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
          .run(),
      active: () => editor.isActive("heading", { level }),
    })
  }
  const wrappers: [string, () => boolean][] = [
    ["bulletList", () => editor.chain().focus().toggleBulletList().run()],
    ["orderedList", () => editor.chain().focus().toggleOrderedList().run()],
    ["blockquote", () => editor.chain().focus().toggleBlockquote().run()],
    ["codeBlock", () => editor.chain().focus().toggleCodeBlock().run()],
    ["callout", () => editor.chain().focus().setCallout().run()],
  ]
  for (const [name, run] of wrappers) {
    if (!blocks.has(name)) continue
    types.push({
      value: name,
      label: config.blocks.find((b) => b.name === name)!.title,
      run: () => void run(),
      active: () => editor.isActive(name),
    })
  }

  let typeSelect: HTMLSelectElement | null = null
  if (types.length > 1) {
    typeSelect = h(
      "select",
      { class: "be-toolbar__select", "aria-label": t("turnInto"), tabindex: "-1" },
      ...types.map((type) => h("option", { value: type.value }, type.label)),
    )
    const select = typeSelect
    select.addEventListener("change", () => types.find((type) => type.value === select.value)?.run())
    items.push({
      el: select,
      update: () => {
        const active = [...types].reverse().find((type) => type.active())
        const inTextblock = editor.state.selection.$from.parent.isTextblock
        select.disabled = !inTextblock
        select.value = active?.value ?? ""
      },
    })
  }

  const markButtons = ["bold", "italic", "underline", "strike", "code"]
    .filter((mark) => marks.has(mark))
    .map((mark) =>
      button(
        mark,
        MARK_ICONS[mark]!,
        () => editor.chain().focus().toggleMark(mark).run(),
        () => ({ active: editor.isActive(mark), disabled: !editor.can().toggleMark(mark) }),
        true,
      ),
    )

  const link = marks.has("link")
    ? button(
        "link",
        "link",
        (trigger) => actions.openLink(trigger),
        () => ({
          active: editor.isActive("link"),
          disabled: !editor.can().setMark("link"),
        }),
        true,
      )
    : null

  const aligns =
    blocks.has("paragraph") || blocks.has("heading")
      ? (["start", "center", "end"] as const).map((align) =>
          button(
            `align${align[0]!.toUpperCase()}${align.slice(1)}`,
            `text-align-${align}`,
            () => editor.chain().focus().toggleTextAlign(align).run(),
            () => ({
              active: editor.isActive({ textAlign: align }),
              disabled: !editor.can().setTextAlign(align),
            }),
            true,
          ),
        )
      : []

  const tableTools = blocks.has("table")
    ? h(
        "div",
        { class: "be-toolbar__group be-toolbar__table", role: "group", "aria-label": t("table"), hidden: true },
        button("addRowBefore", "between-vertical-start", () => editor.chain().focus().addRowBefore().run()),
        button("addRowAfter", "between-vertical-end", () => editor.chain().focus().addRowAfter().run()),
        button("addColumnBefore", "between-horizontal-start", () => editor.chain().focus().addColumnBefore().run()),
        button("addColumnAfter", "between-horizontal-end", () => editor.chain().focus().addColumnAfter().run()),
        button("deleteRow", "table-rows-split", () => editor.chain().focus().deleteRow().run()),
        button("deleteColumn", "columns", () => editor.chain().focus().deleteColumn().run()),
        button("toggleHeaderRow", "panel-top", () => editor.chain().focus().toggleHeaderRow().run()),
        button("deleteTable", "trash", () => editor.chain().focus().deleteTable().run()),
      )
    : null
  if (tableTools) {
    items.push({ el: tableTools, update: () => (tableTools.hidden = !editor.isActive("table")) })
  }

  const thaana = options.thaana
    ? button(
        "thaana",
        "languages",
        () => editor.chain().focus().toggleThaana().run(),
        () => ({ active: !!editor.storage.thaanaKeyboard?.enabled }),
        true,
      )
    : null

  const parts: (HTMLElement | null)[] = [
    group(typeSelect),
    group(...markButtons, link),
    group(...aligns),
    tableTools,
    group(
      button("addBlock", "plus", (trigger) => actions.openInserter(trigger)),
      button("blockActions", "settings", (trigger) => actions.openBlockActions(trigger)),
    ),
    group(
      button(
        "undo",
        "undo",
        () => editor.chain().focus().undo().run(),
        () => ({ disabled: !editor.can().undo() }),
      ),
      button(
        "redo",
        "redo",
        () => editor.chain().focus().redo().run(),
        () => ({ disabled: !editor.can().redo() }),
      ),
      thaana,
    ),
  ]
  el.append(
    ...parts
      .filter((part): part is HTMLElement => !!part)
      .flatMap((part, index) => (index === 0 ? [part] : [separator(), part])),
  )

  // The "block actions" label names the block: set when it updates.
  const blockActions = el.querySelector<HTMLElement>('[data-action="blockActions"]')!
  items.push({
    el: blockActions,
    update: () => {
      const label = t("blockActions", { block: currentTitle(editor) })
      blockActions.setAttribute("aria-label", label)
      blockActions.title = label
    },
  })

  // Roving tabindex.
  const focusable = () =>
    [...el.querySelectorAll<HTMLElement>("button, select")].filter(
      (item) => !item.closest("[hidden]") && !(item as HTMLButtonElement).disabled,
    )
  let current = 0
  const setCurrent = (index: number) => {
    const all = focusable()
    if (!all.length) return
    current = (index + all.length) % all.length
    all.forEach((item, i) => item.setAttribute("tabindex", i === current ? "0" : "-1"))
  }
  el.addEventListener("focusin", (event) => {
    const index = focusable().indexOf(event.target as HTMLElement)
    if (index >= 0) setCurrent(index)
  })
  el.addEventListener("keydown", (event) => {
    const all = focusable()
    const rtl = isRtl(el)
    const next = rtl ? "ArrowLeft" : "ArrowRight"
    const previous = rtl ? "ArrowRight" : "ArrowLeft"
    let index: number | null = null
    if (event.key === next) index = current + 1
    if (event.key === previous) index = current - 1
    if (event.key === "Home") index = 0
    if (event.key === "End") index = all.length - 1
    if (event.key === "Escape") {
      event.preventDefault()
      editor.commands.focus()
      return
    }
    if (index === null) return
    event.preventDefault()
    setCurrent(index)
    focusable()[current]?.focus()
  })

  const update = () => {
    for (const item of items) item.update()
    setCurrent(Math.min(current, focusable().length - 1))
  }
  update()

  return {
    el,
    update,
    /** Focuses the toolbar's current control (Alt+F10). */
    focus: () => {
      setCurrent(current)
      focusable()[current]?.focus()
    },
  }
}

function currentTitle(editor: Editor): string {
  const { config } = editor.storage.blockEditor
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth--) {
    const parent = $from.node(depth - 1).type.name
    if (parent === "doc" || parent === "column") {
      const name = $from.node(depth).type.name
      return config.blocks.find((block) => block.name === name)?.title ?? name
    }
  }
  const selected = editor.state.doc.nodeAt(editor.state.selection.from)
  return config.blocks.find((block) => block.name === selected?.type.name)?.title ?? ""
}
