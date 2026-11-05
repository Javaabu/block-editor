import type { Editor } from "@tiptap/core"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"

import type { MenuItem, Translate } from "../../registry"
import { blockAt, currentBlock, deleteBlock, duplicateBlock, moveBlock, type BlockRef } from "../commands"
import { createBlockMenu } from "./block-menu"
import { h, icon, isRtl } from "./dom"
import { createPopover } from "./popover"
import { hasSettings } from "./settings"

export interface HandleOptions {
  wrapper: HTMLElement
  items: () => MenuItem[]
  insert: (item: MenuItem) => void
  openSettings: (pos: number) => void
  announce: (message: string) => void
}

/** Puts the selection in a block (at its end), so commands that work on the selection target it. */
export function focusBlock(editor: Editor, ref: BlockRef) {
  const { state } = editor
  if (ref.node.isAtom) {
    editor.view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, ref.pos)))
  } else {
    const end = ref.pos + ref.node.nodeSize - 1
    editor.view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(end), -1)))
  }
  editor.view.focus()
}

/**
 * The controls in the gutter beside a block: "+" adds a block after it, the grip
 * drags it (or, pressed, opens its actions: settings, move, duplicate, delete).
 * Keyboard users reach the same actions from the toolbar and with shortcuts.
 */
export function createBlockHandle(editor: Editor, t: Translate, options: HandleOptions) {
  const { wrapper } = options
  let ref: BlockRef | null = null
  let actionsFor: BlockRef | null = null
  let trigger: HTMLElement | null = null

  const plus = h(
    "button",
    { type: "button", class: "be-handle__button", "aria-label": t("addBlock"), title: t("addBlock"), tabindex: "-1" },
    icon("plus"),
  )
  const grip = h(
    "button",
    {
      type: "button",
      class: "be-handle__button be-handle__grip",
      draggable: "true",
      tabindex: "-1",
      title: t("dragBlock"),
    },
    icon("grip-vertical"),
  )
  const el = h("div", { class: "be-handle", hidden: true, "data-be-handle": "" }, plus, grip)
  wrapper.append(el)

  const rtl = () => isRtl(wrapper)

  // Inserter
  const menu = createBlockMenu({
    t,
    search: true,
    onChoose: (item) => {
      inserter.close("action")
      if (actionsFor) focusBlock(editor, actionsFor)
      options.insert(item)
      options.announce(t("blockInserted", { block: item.title }))
    },
  })
  const inserter = createPopover({
    className: "be-inserter",
    root: wrapper,
    rtl,
    role: "dialog",
    label: t("addBlock"),
    ignore: () => [trigger],
    onClose: (reason) => {
      if (reason !== "escape") return
      if (trigger?.isConnected) trigger.focus()
      else editor.commands.focus()
    },
  })
  inserter.el.append(menu.el)

  // Actions
  const actions = createPopover({
    className: "be-actions-menu",
    root: wrapper,
    rtl,
    role: "menu",
    ignore: () => [trigger],
    onClose: (reason) => {
      if (reason !== "escape") return
      if (trigger?.isConnected) trigger.focus()
      else editor.commands.focus()
    },
  })

  const action = (label: string, iconName: string, run: (target: BlockRef) => void, disabled = false) =>
    h(
      "button",
      {
        type: "button",
        role: "menuitem",
        class: "be-menuitem",
        tabindex: "-1",
        disabled,
        onclick: () => {
          const target = actionsFor
          actions.close("action")
          if (target) run(target)
        },
      },
      icon(iconName),
      h("span", {}, label),
    )

  actions.el.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return
    event.preventDefault()
    const all = [...actions.el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')]
    const index = all.indexOf(event.target as HTMLButtonElement)
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? all.length - 1 : index + (event.key === "ArrowDown" ? 1 : -1)
    all[(next + all.length) % all.length]?.focus()
  })

  const titleOf = (target: BlockRef) =>
    editor.storage.blockEditor.config.blocks.find((b) => b.name === target.node.type.name)?.title ??
    target.node.type.name

  const openActions = (target: BlockRef, from: HTMLElement | null) => {
    actionsFor = target
    trigger = from
    const block = editor.storage.blockEditor.config.blocks.find((b) => b.name === target.node.type.name)
    actions.el.setAttribute("aria-label", t("blockActions", { block: titleOf(target) }))
    actions.el.replaceChildren(
      ...[
        hasSettings(block) ? action(t("settings"), "settings", (r) => options.openSettings(r.pos)) : null,
        action(t("moveUp"), "arrow-up", (r) => moved(moveBlock(editor, r, -1)), target.index === 0),
        action(
          t("moveDown"),
          "arrow-down",
          (r) => moved(moveBlock(editor, r, 1)),
          target.index >= target.parent.childCount - 1,
        ),
        action(t("duplicate"), "copy", (r) => duplicateBlock(editor, r)),
        action(t("delete"), "trash", (r) => {
          deleteBlock(editor, r)
          options.announce(t("blockDeleted"))
        }),
      ].filter((item): item is HTMLButtonElement => !!item),
    )
    actions.open(() => (from?.isConnected ? from.getBoundingClientRect() : blockRect(target)))
    actions.el.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
  }

  const openInserter = (target: BlockRef | null, from: HTMLElement | null) => {
    actionsFor = target
    trigger = from
    menu.setItems(options.items())
    if (menu.input) menu.input.value = ""
    inserter.open(() => (from?.isConnected ? from.getBoundingClientRect() : target ? blockRect(target) : null))
    menu.input?.focus()
  }

  const moved = (index: number | null) => {
    if (index !== null) options.announce(t("blockMoved", { position: index + 1 }))
  }

  const blockRect = (target: BlockRef): DOMRect | null => {
    const dom = editor.view.nodeDOM(target.pos)
    return dom instanceof HTMLElement ? dom.getBoundingClientRect() : null
  }

  // Position beside the block.
  const show = (next: BlockRef | null) => {
    ref = next
    if (!next || !editor.isEditable) {
      el.hidden = true
      return
    }
    const dom = editor.view.nodeDOM(next.pos)
    if (!(dom instanceof HTMLElement)) {
      el.hidden = true
      return
    }
    const box = wrapper.getBoundingClientRect()
    const rect = dom.getBoundingClientRect()
    el.hidden = false
    const offset = rtl() ? box.right - rect.right : rect.left - box.left
    el.style.top = `${Math.max(0, rect.top - box.top)}px`
    el.style.insetInlineStart = `${Math.max(0, offset - el.offsetWidth - 4)}px`
    grip.setAttribute("aria-label", t("blockActions", { block: titleOf(next) }))
  }

  const onPointerMove = (event: PointerEvent) => {
    if (event.target instanceof Node && el.contains(event.target)) return
    const found = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })
    if (!found) return
    const target = blockAt(editor.state.doc, found.inside >= 0 ? found.inside : found.pos)
    if (target && target.pos !== ref?.pos) show(target)
  }
  wrapper.addEventListener("pointermove", onPointerMove)

  plus.addEventListener("click", () => openInserter(ref, plus))
  grip.addEventListener("click", () => ref && openActions(ref, grip))

  // Dragging: select the block and hand ProseMirror the slice, which then moves it on drop.
  grip.addEventListener("dragstart", (event) => {
    if (!ref || !event.dataTransfer) return
    const { view } = editor
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, ref.pos)))
    const slice = view.state.selection.content()
    const serialized = (
      view as unknown as { serializeForClipboard?: (s: typeof slice) => { dom: HTMLElement; text: string } }
    ).serializeForClipboard?.(slice)
    event.dataTransfer.clearData()
    event.dataTransfer.setData("text/html", serialized?.dom.innerHTML ?? "")
    event.dataTransfer.setData("text/plain", serialized?.text ?? ref.node.textContent)
    event.dataTransfer.effectAllowed = "copyMove"
    const dom = view.nodeDOM(ref.pos)
    if (dom instanceof HTMLElement) event.dataTransfer.setDragImage(dom, 0, 0)
    view.dragging = { slice, move: true }
  })
  grip.addEventListener("dragend", () => {
    editor.view.dragging = null
  })

  return {
    el,
    /** Follows the selection, for keyboard and touch users. */
    update: () => show(editor.view.hasFocus() || ref ? (currentBlock(editor.state) ?? ref) : null),
    openInserter: (from: HTMLElement | null) => openInserter(currentBlock(editor.state), from),
    openActions: (from: HTMLElement | null) => {
      const target = currentBlock(editor.state)
      if (target) openActions(target, from)
    },
    hide: () => show(null),
    destroy() {
      wrapper.removeEventListener("pointermove", onPointerMove)
      inserter.destroy()
      actions.destroy()
      el.remove()
    },
  }
}
