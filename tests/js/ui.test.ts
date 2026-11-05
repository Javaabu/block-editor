import { describe, expect, it } from "vitest"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"

import {
  blockAt,
  defaultConfig,
  deleteBlock,
  duplicateBlock,
  moveBlock,
  type EditorConfig,
  type JSONDocument,
} from "@javaabu/block-editor"
import { insertItem } from "../../resources/js/editor/menu-items"
import { mount } from "./support/editor"

const paragraphs = (...texts: string[]): JSONDocument => ({
  type: "doc",
  content: texts.map((text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] })),
})

const keydown = (target: EventTarget, key: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }))

const item = (block: string, attrs?: Record<string, unknown>) => ({
  id: block,
  block,
  title: block,
  icon: "square",
  keywords: [],
  category: "text",
  attrs,
})

describe("block commands", () => {
  it("moves up, duplicates and deletes blocks", () => {
    const { editor } = mount({ content: paragraphs("one", "two", "three") })
    const text = () => editor.getText({ blockSeparator: "|" })

    moveBlock(editor, blockAt(editor.state.doc, 7)!, -1)
    expect(text()).toBe("two|one|three")
    expect(moveBlock(editor, blockAt(editor.state.doc, 1)!, -1)).toBeNull()

    duplicateBlock(editor, blockAt(editor.state.doc, 1)!)
    expect(text()).toBe("two|two|one|three")

    deleteBlock(editor, blockAt(editor.state.doc, 1)!)
    expect(text()).toBe("two|one|three")
  })

  it("keeps a paragraph to type in when the last block is deleted", () => {
    const { editor } = mount({ content: { type: "doc", content: [{ type: "horizontalRule" }] } })
    deleteBlock(editor, blockAt(editor.state.doc, 0)!)
    expect(editor.getJSON().content).toEqual([{ type: "paragraph", attrs: { dir: null, textAlign: null } }])
  })

  it("finds blocks inside columns", () => {
    const { editor } = mount({
      content: {
        type: "doc",
        content: [
          {
            type: "columns",
            attrs: { layout: "1-1" },
            content: [
              { type: "column", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }] },
              {
                type: "column",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "b" }] },
                  { type: "paragraph", content: [{ type: "text", text: "c" }] },
                ],
              },
            ],
          },
        ],
      },
    })
    let pos = 0
    editor.state.doc.descendants((node, at) => {
      if (node.isText && node.text === "c") pos = at
    })
    const ref = blockAt(editor.state.doc, pos)!
    expect(ref.parent.type.name).toBe("column")
    expect(ref.index).toBe(1)
    moveBlock(editor, ref, -1)
    expect(editor.state.doc.child(0).child(1).textContent).toBe("cb")
  })
})

describe("inserting blocks", () => {
  it("turns an empty paragraph into text blocks and adds a paragraph after a filled one", () => {
    const { editor } = mount({ content: paragraphs("filled") })
    editor.commands.setTextSelection(3)
    insertItem(editor, item("heading", { level: 3 }), () => undefined)
    expect(editor.getJSON().content!.map((node) => node.type)).toEqual(["paragraph", "heading"])
    expect(editor.getJSON().content![1]!.attrs!.level).toBe(3)

    for (const [block, type] of [
      ["bulletList", "bulletList"],
      ["orderedList", "orderedList"],
      ["blockquote", "blockquote"],
      ["codeBlock", "codeBlock"],
      ["callout", "callout"],
      ["paragraph", "paragraph"],
    ] as const) {
      const { editor: fresh } = mount()
      fresh.commands.setTextSelection(1)
      insertItem(fresh, item(block), () => undefined)
      expect(fresh.getJSON().content![0]!.type, block).toBe(type)
    }
  })

  it("inserts tables, dividers and atoms, opening settings for atoms that need them", () => {
    const opened: number[] = []
    const { editor } = mount()
    editor.commands.setTextSelection(1)
    insertItem(editor, item("table"), () => undefined)
    expect(editor.getJSON().content![0]!.type).toBe("table")

    const { editor: second } = mount()
    second.commands.setTextSelection(1)
    insertItem(second, item("horizontalRule"), () => undefined)
    insertItem(second, item("image"), (pos) => opened.push(pos))
    insertItem(second, item("embed"), (pos) => opened.push(pos))
    insertItem(second, item("button"), (pos) => opened.push(pos))
    insertItem(second, item("html"), (pos) => opened.push(pos))
    expect(second.getJSON().content!.map((node) => node.type)).toEqual(
      expect.arrayContaining(["horizontalRule", "image", "embed", "button", "html"]),
    )
    expect(opened).toHaveLength(4)
  })

  it("previews atoms and prompts for settings when they're empty", () => {
    const { host } = mount({
      content: {
        type: "doc",
        content: [
          { type: "image", attrs: { src: "https://example.com/a.png", alt: "A", caption: "ކެޕްޝަން" } },
          { type: "image", attrs: { src: null } },
          { type: "embed", attrs: { src: "https://youtu.be/dQw4w9WgXcQ", title: "Video" } },
          { type: "button", attrs: { text: null, url: null } },
          { type: "html", attrs: { html: "<p>x</p>" } },
        ],
      },
    })
    expect(host.querySelector(".be-atom img")).toHaveAttribute("src", "https://example.com/a.png")
    expect(host.querySelector(".be-atom figcaption")).toHaveTextContent("ކެޕްޝަން")
    expect([...host.querySelectorAll(".be-atom__prompt")].map((p) => p.textContent)).toEqual([
      "Add the image link in the settings",
      "Set the button text and link in the settings",
    ])
    expect(host.querySelector(".be-embed")).toHaveAttribute("data-framed")
    expect(host.querySelector(".be-html pre")).toHaveTextContent("<p>x</p>")
  })
})

describe("blocks defined only in PHP", () => {
  const config = (): EditorConfig => {
    const base = defaultConfig()
    return {
      ...base,
      blocks: [
        ...base.blocks,
        {
          name: "alert",
          title: "Alert",
          description: "",
          group: "block",
          content: "inline*",
          marks: ["bold"],
          insertable: true,
          category: "advanced",
          icon: "bell",
          keywords: [],
          attributes: {
            tone: {
              type: "enum",
              default: "calm",
              editable: true,
              input: "select",
              label: "Tone",
              options: [
                { value: "calm", label: "Calm" },
                { value: "loud", label: "Loud" },
              ],
            },
          },
        },
        {
          name: "map",
          title: "Map",
          description: "",
          group: "block",
          content: "",
          marks: null,
          insertable: true,
          category: "embed",
          icon: "map",
          keywords: [],
          attributes: { place: { type: "string", default: null, editable: true, input: "text", label: "Place" } },
        },
      ],
    }
  }

  it("builds generic nodes from the config and keeps their content", () => {
    const { editor, host } = mount({
      config: config(),
      content: {
        type: "doc",
        content: [
          { type: "alert", attrs: { tone: "loud" }, content: [{ type: "text", text: "ހޭލާ" }] },
          { type: "map", attrs: { place: "Malé" } },
          { type: "map", attrs: { place: null } },
        ],
      },
    })
    expect(editor.getJSON().content![0]).toMatchObject({ type: "alert", attrs: { tone: "loud" } })
    expect(editor.schema.nodes.alert!.spec.marks).toBe("bold")
    expect(host.querySelector(".be-generic__card")).toHaveTextContent("MapMalé")
    expect(host.querySelector(".be-atom__prompt")).toHaveTextContent("Set this block up in the settings")

    insertItem(editor, item("map"), () => undefined)
    expect(editor.getJSON().content!.filter((node) => node.type === "map")).toHaveLength(3)
  })
})

describe("the block handle", () => {
  it("adds a block from the inserter", () => {
    const { editor, host } = mount({ content: paragraphs("one") })
    editor.commands.focus()
    editor.commands.setTextSelection(2)
    host.querySelector<HTMLButtonElement>('[data-action="addBlock"]')!.click()
    const dialog = document.querySelector<HTMLElement>(".be-inserter")!
    expect(dialog).toBeVisible()
    const search = dialog.querySelector<HTMLInputElement>('input[type="search"]')!
    search.value = "divid"
    search.dispatchEvent(new Event("input"))
    expect(dialog.querySelectorAll('[role="option"]')).toHaveLength(1)
    keydown(search, "Enter")
    expect(
      editor
        .getJSON()
        .content!.map((node) => node.type)
        .slice(0, 2),
    ).toEqual(["paragraph", "horizontalRule"])
    expect(dialog).not.toBeVisible()
  })

  it("filters to nothing and says so", () => {
    const { editor, host } = mount()
    editor.commands.focus()
    host.querySelector<HTMLButtonElement>('[data-action="addBlock"]')!.click()
    const search = document.querySelector<HTMLInputElement>(".be-inserter input")!
    search.value = "zzzz"
    search.dispatchEvent(new Event("input"))
    expect(document.querySelector(".be-inserter")).toHaveTextContent("No matching blocks")
    keydown(document.querySelector(".be-inserter")!, "Escape")
    expect(document.querySelector(".be-inserter")).not.toBeVisible()
  })

  it("runs block actions from the menu", () => {
    const { editor, host } = mount({ content: paragraphs("one", "two") })
    editor.commands.focus()
    editor.commands.setTextSelection(7)
    host.querySelector<HTMLButtonElement>('[data-action="blockActions"]')!.click()
    const menu = document.querySelector<HTMLElement>(".be-actions-menu")!
    expect(menu).toHaveAccessibleName("Block actions (Text)")
    const items = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
    expect(items.map((button) => button.textContent)).toEqual(["Move up", "Move down", "Duplicate", "Delete"])
    expect(items[1]).toBeDisabled()
    keydown(items[0]!, "ArrowDown")
    items[0]!.click()
    expect(editor.getText({ blockSeparator: "|" })).toBe("two|one")

    editor.commands.setTextSelection(2)
    host.querySelector<HTMLButtonElement>('[data-action="blockActions"]')!.click()
    ;[...document.querySelectorAll<HTMLButtonElement>('.be-actions-menu [role="menuitem"]')]
      .find((b) => b.textContent === "Delete")!
      .click()
    expect(editor.getText({ blockSeparator: "|" })).toBe("one")
  })

  it("offers settings for blocks that have them", () => {
    const { editor, host } = mount({
      content: {
        type: "doc",
        content: [
          {
            type: "columns",
            attrs: { layout: "1-1" },
            content: [
              { type: "column", content: [{ type: "paragraph" }] },
              { type: "column", content: [{ type: "paragraph" }] },
            ],
          },
        ],
      },
    })
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)))
    host.querySelector<HTMLButtonElement>('[data-action="blockActions"]')!.click()
    ;[...document.querySelectorAll<HTMLButtonElement>('.be-actions-menu [role="menuitem"]')]
      .find((b) => b.textContent === "Settings")!
      .click()
    const layout = document.querySelector<HTMLSelectElement>('.be-settings select[name="layout"]')!
    layout.value = "1-1-1"
    layout.dispatchEvent(new Event("change"))
    expect(editor.state.doc.child(0).childCount).toBe(3)
    keydown(document.querySelector(".be-settings")!, "Escape")
    expect(document.querySelector(".be-settings")).not.toBeVisible()
  })

  it("names the grip after the block", () => {
    const { host } = mount({ content: paragraphs("one") })
    expect(host.querySelector(".be-handle__grip")).toHaveAttribute("title", "Drag to move, or press Enter for actions")
  })
})

describe("links", () => {
  it("adds, rejects unsafe and removes links", () => {
    const { editor, host } = mount({ content: paragraphs("Javaabu") })
    editor.commands.setTextSelection({ from: 1, to: 8 })
    host.querySelector<HTMLButtonElement>('[data-action="link"]')!.click()
    const form = document.querySelector<HTMLFormElement>(".be-link")!
    const url = form.querySelector<HTMLInputElement>('input[inputmode="url"]')!

    url.value = "javascript:alert(1)"
    form.requestSubmit()
    expect(url).toHaveAttribute("aria-invalid", "true")
    expect(form.querySelector(".be-error")).toBeVisible()

    url.value = "https://javaabu.com"
    form.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked = true
    form.requestSubmit()
    expect(editor.getAttributes("link")).toMatchObject({ href: "https://javaabu.com", target: "_blank" })

    editor.commands.setTextSelection(3)
    editor.commands.keyboardShortcut("Mod-k")
    expect(url.value).toBe("https://javaabu.com")
    ;[...form.querySelectorAll("button")].find((b) => b.textContent === "Remove link")!.click()
    expect(editor.isActive("link")).toBe(false)
  })

  it("inserts the URL as text when nothing is selected", () => {
    const { editor } = mount()
    editor.commands.setTextSelection(1)
    editor.commands.keyboardShortcut("Mod-k")
    const form = document.querySelector<HTMLFormElement>(".be-link")!
    form.querySelector<HTMLInputElement>('input[inputmode="url"]')!.value = "/about"
    form.requestSubmit()
    expect(editor.getJSON().content![0]!.content![0]).toMatchObject({ text: "/about", marks: [{ type: "link" }] })
  })
})

describe("the toolbar", () => {
  it("moves focus with the arrow keys, mirrored in RTL", () => {
    const { host, editor } = mount()
    const toolbar = host.querySelector<HTMLElement>('[role="toolbar"]')!
    editor.commands.keyboardShortcut("Alt-F10")
    const first = document.activeElement!
    expect(toolbar.contains(first)).toBe(true)
    keydown(first, "ArrowRight")
    expect(document.activeElement).not.toBe(first)
    keydown(document.activeElement!, "Home")
    expect(document.activeElement).toBe(first)

    toolbar.closest(".be-editor")!.setAttribute("dir", "rtl")
    keydown(first, "ArrowLeft")
    expect(document.activeElement).not.toBe(first)
    keydown(document.activeElement!, "End")
    expect(document.activeElement).not.toBe(first)
  })

  it("shows table tools inside a table and converts blocks", () => {
    const { host, editor } = mount({ content: paragraphs("x") })
    const tableTools = host.querySelector<HTMLElement>(".be-toolbar__table")!
    expect(tableTools).not.toBeVisible()
    editor.commands.setTextSelection(1)
    editor.commands.insertTable({ rows: 2, cols: 2 })
    expect(tableTools).toBeVisible()
    host.querySelector<HTMLButtonElement>('[data-action="addRowAfter"]')!.click()
    expect(editor.getJSON().content!.find((node) => node.type === "table")!.content).toHaveLength(3)

    const { host: second, editor: other } = mount({ content: paragraphs("x") })
    other.view.dispatch(other.state.tr.setSelection(TextSelection.create(other.state.doc, 1)))
    const select = second.querySelector<HTMLSelectElement>(".be-toolbar__select")!
    select.value = "heading:2"
    select.dispatchEvent(new Event("change"))
    expect(other.getJSON().content![0]).toMatchObject({ type: "heading", attrs: { level: 2 } })
    second.querySelector<HTMLButtonElement>('[data-action="alignCenter"]')!.click()
    expect(other.getJSON().content![0]!.attrs!.textAlign).toBe("center")
  })
})
