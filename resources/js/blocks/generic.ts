import { Node, type AnyExtension } from "@tiptap/core"

import { atomView, settingsPrompt } from "../editor/node-view"
import { h, icon } from "../editor/ui/dom"
import type { BlockConfig } from "../types"
import { attributesFrom, dataAttrs } from "./attributes"

/**
 * A node for a block that has a PHP class but no JS module: built from its config.
 * Leaf blocks show a card with their settings; others wrap their text or blocks.
 */
export function genericBlock(block: BlockConfig): AnyExtension {
  const leaf = !block.content.trim()

  return Node.create({
    name: block.name,
    group: block.group || undefined,
    content: leaf ? undefined : block.content,
    marks: block.marks ? block.marks.join(" ") : undefined,
    atom: leaf,
    draggable: leaf,
    selectable: true,
    defining: !leaf,
    addAttributes: () => attributesFrom(block),
    parseHTML: () => [{ tag: `div[data-block="${block.name}"]` }],
    renderHTML: ({ node }) =>
      leaf
        ? ["div", { class: "be-generic", ...dataAttrs(block.name, node.attrs) }]
        : ["div", { class: "be-generic", ...dataAttrs(block.name, node.attrs) }, 0],
    addNodeView: leaf
      ? () => (props) =>
          atomView(props, (node) => {
            const t = props.editor.storage.blockEditor.t
            const summary = Object.entries(block.attributes)
              .filter(([, attribute]) => attribute.editable && ["string", "text", "url"].includes(attribute.type))
              .map(([name]) => node.attrs[name])
              .find((value): value is string => typeof value === "string" && value.trim() !== "")
            return h(
              "div",
              { class: "be-generic__card" },
              icon(block.icon),
              h("strong", {}, block.title),
              summary ? h("span", { dir: "auto" }, summary) : settingsPrompt(props, t("genericEmpty")),
            )
          })
      : undefined,
  })
}
