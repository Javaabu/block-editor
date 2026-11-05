import { Node } from "@tiptap/core"
import { CalloutNode, type CalloutVariant } from "@javaabu/onu/editor"
import { mergeAttributes } from "@tiptap/core"

import { atomView, settingsPrompt } from "../editor/node-view"
import { h } from "../editor/ui/dom"
import { defineBlock } from "../registry"
import { attributesFrom, dataAttrs } from "./attributes"

export const callout = defineBlock({
  name: "callout",
  extensions: () => [
    CalloutNode.extend({
      renderHTML({ HTMLAttributes }) {
        return [
          "div",
          mergeAttributes({ "data-type": "callout", class: "block-callout", role: "note" }, HTMLAttributes),
          0,
        ]
      },
    }),
  ],
  insert: (editor, { item }) => {
    const variant = (item.attrs?.variant as CalloutVariant | undefined) ?? "info"
    const ref = editor.state.selection.$from.parent
    if (ref.isTextblock && ref.content.size === 0) {
      editor.chain().focus().setCallout({ variant }).run()
      return
    }
    editor.chain().focus().insertContent({ type: "callout", attrs: { variant } }).run()
  },
})

export const button = defineBlock({
  name: "button",
  settingsOnInsert: true,
  extensions: ({ block }) => [
    Node.create({
      name: "button",
      group: "block",
      atom: true,
      draggable: true,
      selectable: true,
      addAttributes: () => attributesFrom(block),
      parseHTML: () => [{ tag: 'div[data-block="button"]' }],
      renderHTML: ({ node }) => [
        "div",
        { class: "block-button", "data-align": node.attrs.align ?? "start", ...dataAttrs("button", node.attrs) },
        [
          "span",
          { class: "block-button__link", "data-variant": node.attrs.variant ?? "primary" },
          node.attrs.text ?? "",
        ],
      ],
      addNodeView() {
        return (props) =>
          atomView(props, (node) => {
            const t = props.editor.storage.blockEditor.t
            const text = node.attrs.text as string | null
            if (!text || !node.attrs.url) return settingsPrompt(props, t("buttonEmpty"))
            return h(
              "div",
              { class: "block-button", "data-align": (node.attrs.align as string | null) ?? "start" },
              h(
                "span",
                {
                  class: "block-button__link",
                  "data-variant": (node.attrs.variant as string | null) ?? "primary",
                  dir: "auto",
                },
                text,
              ),
            )
          })
      },
    }),
  ],
})

export const html = defineBlock({
  name: "html",
  settingsOnInsert: true,
  extensions: ({ block }) => [
    Node.create({
      name: "html",
      group: "block",
      atom: true,
      draggable: true,
      selectable: true,
      addAttributes: () => attributesFrom(block),
      parseHTML: () => [{ tag: 'div[data-block="html"]' }],
      renderHTML: ({ node }) => ["div", { class: "block-html", ...dataAttrs("html", node.attrs) }],
      addNodeView() {
        return (props) =>
          atomView(props, (node) => {
            const t = props.editor.storage.blockEditor.t
            const code = (node.attrs.html as string | null) ?? ""
            if (!code.trim()) return settingsPrompt(props, t("htmlEmpty"))
            return h(
              "div",
              { class: "be-html" },
              h("span", { class: "be-html__label" }, "HTML"),
              h("pre", { dir: "ltr" }, code.length > 600 ? `${code.slice(0, 600)}…` : code),
            )
          })
      },
    }),
  ],
})
