import type { Editor } from "@tiptap/core"

import type { Translate } from "../../registry"
import { isSafeUrl } from "../../url"
import { h, icon, uid } from "./dom"
import { createPopover } from "./popover"

/** The link popover: URL, open in a new tab, apply and remove. Mod+K opens it. */
export function createLinkPopover(editor: Editor, t: Translate, root: HTMLElement, rtl: () => boolean) {
  let trigger: HTMLElement | null = null
  const errorId = uid("be-link-error")
  const url = h("input", {
    type: "url",
    class: "be-input",
    dir: "ltr",
    inputmode: "url",
    autocomplete: "off",
    "aria-label": t("linkUrl"),
    placeholder: "https://",
    "aria-describedby": errorId,
  })
  const newTab = h("input", { type: "checkbox", class: "be-checkbox" })
  const error = h("p", { id: errorId, class: "be-error", hidden: true }, t("linkInvalid"))
  const remove = h(
    "button",
    { type: "button", class: "be-button be-button--ghost", onclick: () => apply(null) },
    icon("unlink"),
    t("linkRemove"),
  )
  const form = h(
    "form",
    { class: "be-link", onsubmit: (event: Event) => (event.preventDefault(), apply(url.value.trim())) },
    h("label", { class: "be-field" }, h("span", { class: "be-label" }, t("linkUrl")), url),
    error,
    h("label", { class: "be-check" }, newTab, h("span", {}, t("linkNewTab"))),
    h("div", { class: "be-actions" }, remove, h("button", { type: "submit", class: "be-button" }, t("linkApply"))),
  )

  const popover = createPopover({
    className: "be-link-popover",
    root,
    rtl,
    role: "dialog",
    label: t("link"),
    ignore: () => [trigger],
    onClose: (reason) => {
      if (reason !== "outside") editor.commands.focus()
    },
  })
  popover.el.append(form)

  const apply = (href: string | null) => {
    const chain = editor.chain().focus().extendMarkRange("link")
    if (!href) {
      chain.unsetLink().run()
      popover.close()
      return
    }
    if (!isSafeUrl(href)) {
      error.hidden = false
      url.setAttribute("aria-invalid", "true")
      url.focus()
      return
    }
    const target = newTab.checked ? "_blank" : null
    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href, target } }] }).run()
    } else {
      chain.setLink({ href, target }).run()
    }
    popover.close()
  }

  return {
    open(from: HTMLElement | null) {
      trigger = from
      const attrs = editor.getAttributes("link")
      url.value = (attrs.href as string | undefined) ?? ""
      newTab.checked = attrs.target === "_blank"
      remove.hidden = !attrs.href
      error.hidden = true
      url.removeAttribute("aria-invalid")
      popover.open(() => {
        if (trigger?.isConnected) return trigger.getBoundingClientRect()
        const { from: start } = editor.state.selection
        const coords = editor.view.coordsAtPos(start)
        return new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top)
      })
      url.focus()
    },
    destroy: () => popover.destroy(),
  }
}
