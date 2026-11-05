import type { Editor } from "@tiptap/core"
import { attachThaanaKeyboard, type ThaanaKeyboardController } from "@javaabu/onu/thaana"

import { getBlock, type Translate } from "../../registry"
import type { AttributeConfig, BlockConfig } from "../../types"
import { h, icon, uid } from "./dom"
import { createPopover } from "./popover"

/** Whether a block has anything to set in its settings panel. */
export function hasSettings(block: BlockConfig | undefined): boolean {
  return !!block && Object.values(block.attributes).some((attribute) => attribute.editable)
}

/**
 * The settings panel of a block: one input per editable attribute (from the PHP
 * Attribute definitions), applied as you type. Thaana inputs type Thaana when the
 * editor does.
 */
export function createSettingsPanel(editor: Editor, t: Translate, root: HTMLElement, rtl: () => boolean) {
  let pos: number | null = null
  let controllers: ThaanaKeyboardController[] = []
  const titleId = uid("be-settings-title")
  const title = h("h2", { id: titleId, class: "be-settings__title" })
  const body = h("div", { class: "be-settings__body" })
  const close = h(
    "button",
    {
      type: "button",
      class: "be-icon-button",
      "aria-label": t("close"),
      title: t("close"),
      onclick: () => popover.close("action"),
    },
    icon("x"),
  )
  const popover = createPopover({
    className: "be-settings",
    root,
    rtl,
    role: "dialog",
    onClose: (reason) => {
      controllers.forEach((controller) => controller.detach())
      controllers = []
      if (reason !== "outside" && pos !== null && editor.state.doc.nodeAt(pos)) {
        editor.chain().focus().setNodeSelection(pos).run()
      }
      pos = null
    },
  })
  popover.el.setAttribute("aria-labelledby", titleId)
  popover.el.append(h("div", { class: "be-settings__header" }, title, close), body)

  const update = (name: string, value: unknown) => {
    if (pos === null) return
    const node = editor.state.doc.nodeAt(pos)
    if (!node) return
    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, [name]: value }))
    getBlock(node.type.name)?.afterSettingsChange?.(editor, pos)
    popover.reposition()
  }

  const field = (name: string, attribute: AttributeConfig, value: unknown): HTMLElement => {
    const id = uid("be-setting")
    const label = attribute.label ?? name
    const required = attribute.required ? h("span", { class: "be-required", "aria-hidden": "true" }, " *") : null
    const help = attribute.help ? h("p", { class: "be-help", id: `${id}-help` }, attribute.help) : null
    const common = {
      id,
      name,
      required: attribute.required,
      "aria-describedby": help ? `${id}-help` : undefined,
    }

    if (attribute.input === "checkbox") {
      const input = h("input", { ...common, type: "checkbox", class: "be-checkbox", checked: !!value })
      input.addEventListener("change", () => update(name, input.checked))
      return h("div", { class: "be-check" }, input, h("label", { for: id }, label), help)
    }

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    if (attribute.input === "select") {
      input = h(
        "select",
        { ...common, class: "be-input" },
        attribute.required ? null : h("option", { value: "" }, ""),
        ...(attribute.options ?? []).map((option) => h("option", { value: option.value }, option.label)),
      )
      input.value = value === null || value === undefined ? "" : String(value)
      input.addEventListener("change", () => update(name, input.value === "" ? null : input.value))
    } else if (attribute.input === "textarea" || attribute.input === "code") {
      input = h("textarea", {
        ...common,
        class: `be-input ${attribute.input === "code" ? "be-input--code" : ""}`,
        rows: attribute.input === "code" ? 8 : 3,
        dir: attribute.input === "code" ? "ltr" : "auto",
        spellcheck: attribute.input === "code" ? "false" : undefined,
        maxlength: attribute.max,
      })
      input.value = typeof value === "string" ? value : ""
      input.addEventListener("input", () => update(name, input.value === "" ? null : input.value))
    } else {
      const number = attribute.input === "number"
      input = h("input", {
        ...common,
        type: number ? "number" : attribute.input === "url" ? "url" : "text",
        class: "be-input",
        dir: attribute.input === "url" ? "ltr" : "auto",
        min: number ? attribute.min : undefined,
        max: number ? attribute.max : undefined,
        maxlength: number ? undefined : attribute.max,
        inputmode: attribute.input === "url" ? "url" : undefined,
        autocomplete: "off",
      })
      input.value = value === null || value === undefined ? "" : String(value)
      input.addEventListener("input", () => {
        const raw = (input as HTMLInputElement).value
        update(name, raw === "" ? null : number ? Number(raw) : raw)
      })
    }

    if (attribute.thaana && editor.storage.thaanaKeyboard) {
      const controller = attachThaanaKeyboard(input, { enabled: !!editor.storage.thaanaKeyboard.enabled })
      controllers.push(controller)
      if (controller.isEnabled()) {
        input.setAttribute("lang", "dv")
        input.setAttribute("dir", "rtl")
      }
    }

    return h("div", { class: "be-field" }, h("label", { for: id, class: "be-label" }, label, required), input, help)
  }

  return {
    /** Opens the panel for the block at a position. */
    open(at: number) {
      const node = editor.state.doc.nodeAt(at)
      const block = editor.storage.blockEditor.config.blocks.find((b) => b.name === node?.type.name)
      if (!node || !block || !hasSettings(block)) return false
      if (popover.isOpen()) popover.close("action")
      pos = at
      title.textContent = t("blockSettings", { block: block.title })
      body.replaceChildren(
        ...Object.entries(block.attributes)
          .filter(([, attribute]) => attribute.editable)
          .map(([name, attribute]) => field(name, attribute, node.attrs[name])),
      )
      popover.open(() => {
        if (pos === null) return null
        const dom = editor.view.nodeDOM(pos)
        return dom instanceof HTMLElement ? dom.getBoundingClientRect() : null
      })
      body.querySelector<HTMLElement>("input, select, textarea")?.focus()
      return true
    },
    close: () => popover.close("action"),
    isOpen: () => popover.isOpen(),
    destroy: () => popover.destroy(),
  }
}
