import { Extension, type Editor, type Range } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import Suggestion from "@tiptap/suggestion"

import type { MenuItem } from "../registry"
import { createBlockMenu, filterItems } from "./ui/block-menu"
import { createPopover } from "./ui/popover"

export const slashMenuKey = new PluginKey("blockEditorSlash")

export interface SlashOptions {
  items: () => MenuItem[]
  onChoose: (editor: Editor, item: MenuItem, range: Range) => void
  root: () => HTMLElement
  rtl: () => boolean
}

/** Type "/" for a menu of blocks; keep typing to filter, arrows and Enter to choose. */
export const SlashMenu = Extension.create<SlashOptions>({
  name: "blockEditorSlash",

  addOptions() {
    return { items: () => [], onChoose: () => undefined, root: () => document.body, rtl: () => false }
  },

  addProseMirrorPlugins() {
    const options = this.options
    const editor = this.editor
    const t = editor.storage.blockEditor.t

    return [
      Suggestion<MenuItem, MenuItem>({
        editor,
        pluginKey: slashMenuKey,
        char: "/",
        startOfLine: false,
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          return $from.parent.isTextblock && $from.parent.type.name !== "codeBlock"
        },
        items: ({ query }) => filterItems(options.items(), query),
        command: ({ editor: e, range, props }) => options.onChoose(e, props, range),
        render: () => {
          let current: { range: Range; rect: (() => DOMRect | null) | null } | null = null
          const menu = createBlockMenu({
            t,
            search: false,
            onChoose: (item) => {
              if (current) options.onChoose(editor, item, current.range)
            },
          })
          const popover = createPopover({ className: "be-slash", root: options.root(), rtl: options.rtl })
          popover.el.append(menu.el)
          editor.on("destroy", () => popover.destroy())

          return {
            onStart: (props) => {
              current = { range: props.range, rect: props.clientRect ?? null }
              menu.setItems(props.items)
              const list = menu.el.querySelector('[role="listbox"]')
              if (list) editor.view.dom.setAttribute("aria-controls", list.id)
              editor.view.dom.setAttribute("aria-expanded", "true")
              popover.open(() => current?.rect?.() ?? null)
            },
            onUpdate: (props) => {
              current = { range: props.range, rect: props.clientRect ?? null }
              menu.setItems(props.items)
              popover.reposition()
            },
            onKeyDown: ({ event }) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                return menu.move(event.key === "ArrowDown" ? 1 : -1)
              }
              if (event.key === "Enter" || event.key === "Tab") return menu.choose()
              if (event.key === "Escape") {
                popover.close("escape")
                return true
              }
              return false
            },
            onExit: () => {
              current = null
              editor.view.dom.removeAttribute("aria-controls")
              editor.view.dom.setAttribute("aria-expanded", "false")
              popover.close()
            },
          }
        },
      }),
    ]
  },
})
