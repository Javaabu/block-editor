import { Node } from "@tiptap/core"
import { Embed as OnuEmbed } from "@javaabu/onu/editor"

import { atomView, settingsPrompt } from "../editor/node-view"
import { h } from "../editor/ui/dom"
import { defineBlock } from "../registry"
import { toEmbedUrl } from "../embeds"
import { isSafeImageUrl } from "../url"
import { attributesFrom, dataAttrs } from "./attributes"

export const image = defineBlock({
  name: "image",
  settingsOnInsert: true,
  extensions: ({ block }) => [
    Node.create({
      name: "image",
      group: "block",
      atom: true,
      draggable: true,
      selectable: true,
      addAttributes: () => attributesFrom(block),
      parseHTML: () => [
        { tag: 'figure[data-block="image"]' },
        {
          tag: "img[src]",
          getAttrs: (element) => ({ src: element.getAttribute("src"), alt: element.getAttribute("alt") }),
        },
      ],
      renderHTML: ({ node }) => {
        const src = isSafeImageUrl(node.attrs.src) ? (node.attrs.src as string) : null
        return [
          "figure",
          { class: "block-image", ...dataAttrs("image", node.attrs) },
          src ? ["img", { src, alt: (node.attrs.alt as string | null) ?? "" }] : ["span", {}, ""],
        ]
      },
      addNodeView() {
        return (props) =>
          atomView(props, (node) => {
            const t = props.editor.storage.blockEditor.t
            const src = node.attrs.src as string | null
            if (!isSafeImageUrl(src)) return settingsPrompt(props, t("imageEmpty"))
            const caption = node.attrs.caption as string | null
            return h(
              "figure",
              { class: "block-image" },
              h("img", { src, alt: (node.attrs.alt as string | null) ?? "", draggable: "false" }),
              caption ? h("figcaption", { dir: "auto" }, caption) : null,
            )
          })
      },
    }),
  ],
})

export const embed = defineBlock({
  name: "embed",
  settingsOnInsert: true,
  extensions: () => [
    OnuEmbed.extend({
      addNodeView() {
        return (props) =>
          atomView(props, (node) => {
            const t = props.editor.storage.blockEditor.t
            const src = node.attrs.src as string | null
            if (!src) return settingsPrompt(props, t("embedEmpty"))
            const framed = toEmbedUrl(src)
            return h(
              "div",
              { class: "be-embed", "data-framed": framed ? "" : undefined },
              h("span", { class: "be-embed__play", "aria-hidden": "true" }, "▶"),
              h(
                "span",
                { class: "be-embed__text" },
                h("strong", { dir: "auto" }, (node.attrs.title as string | null) || t("embedPreview", { url: "" })),
                h("span", { class: "be-embed__url", dir: "ltr" }, src),
              ),
            )
          })
      },
    }),
  ],
})
