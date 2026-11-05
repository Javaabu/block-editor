import type { Editor, NodeViewRendererProps } from "@tiptap/core"
import type { Node as PMNode } from "@tiptap/pm/model"
import type { NodeView } from "@tiptap/pm/view"

import { h } from "./ui/dom"

/** What a block's settings panel opener looks like to node views. */
export function openSettings(editor: Editor, pos: number) {
  editor.storage.blockEditor?.openSettings?.(pos)
}

/**
 * A node view for an atom block (image, button, embed, HTML, …): a preview that
 * re-renders when the attributes change, selects on click and opens the block's
 * settings on double click or Enter.
 */
export function atomView(
  props: NodeViewRendererProps,
  render: (node: PMNode) => Node,
  options: { tag?: string; className?: string } = {},
): NodeView {
  const { editor } = props
  let node = props.node
  const dom = h((options.tag ?? "div") as "div", {
    class: `be-atom ${options.className ?? ""}`.trim(),
    "data-block": node.type.name,
  })

  const draw = () => {
    dom.replaceChildren(render(node))
  }
  draw()

  dom.addEventListener("dblclick", (event) => {
    event.preventDefault()
    const pos = typeof props.getPos === "function" ? props.getPos() : undefined
    if (typeof pos === "number") openSettings(editor, pos)
  })

  return {
    dom,
    update(next) {
      if (next.type !== node.type) return false
      node = next
      draw()
      return true
    },
    selectNode() {
      dom.classList.add("is-selected")
    },
    deselectNode() {
      dom.classList.remove("is-selected")
    },
    stopEvent(event) {
      // Let buttons inside the preview (the "settings" prompt) work.
      return event.target instanceof HTMLElement && !!event.target.closest("[data-be-stop]")
    },
    ignoreMutation: () => true,
  }
}

/** A button inside a preview that opens the block's settings. */
export function settingsPrompt(props: NodeViewRendererProps, text: string): HTMLElement {
  return h(
    "button",
    {
      type: "button",
      class: "be-atom__prompt",
      "data-be-stop": "",
      onclick: (event: Event) => {
        event.preventDefault()
        const pos = typeof props.getPos === "function" ? props.getPos() : undefined
        if (typeof pos === "number") openSettings(props.editor, pos)
      },
    },
    text,
  )
}
