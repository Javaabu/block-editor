import { describe, expect, it, vi } from "vitest"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"

import { defaultConfig, type JSONDocument } from "@javaabu/block-editor"
import { fixture, mount } from "./support/editor"

function texts(node: { text?: string; content?: unknown[] }): string[] {
  return [...(node.text ? [node.text] : []), ...((node.content ?? []) as (typeof node)[]).flatMap(texts)]
}

describe("createBlockEditor", () => {
  it("loads every fixture and keeps its content", async () => {
    for (const name of [
      "paragraphs",
      "headings",
      "lists",
      "quote-callout",
      "code",
      "table",
      "media",
      "button-html",
      "columns",
      "mixed-direction",
      "marks",
    ]) {
      const doc = (await fixture(name)) as JSONDocument
      const { instance } = mount({ content: doc })
      const json = instance.getJSON()
      expect(
        json.content.map((node) => node.type),
        name,
      ).toEqual(doc.content.map((node) => node.type))
      expect(texts(json), name).toEqual(texts(doc))
      instance.destroy()
    }
  })

  it("starts with an empty paragraph and accepts JSON strings", () => {
    expect(mount().instance.getJSON()).toEqual({
      type: "doc",
      content: [{ type: "paragraph", attrs: { dir: null, textAlign: null } }],
    })

    const { instance } = mount({
      content: JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "ދިވެހި" }] }],
      }),
    })
    expect(instance.editor.getText()).toBe("ދިވެހި")
  })

  it("drops unknown blocks instead of losing the whole document", () => {
    const { instance } = mount({
      content: {
        type: "doc",
        content: [
          { type: "mystery", content: [{ type: "text", text: "gone" }] },
          { type: "paragraph", content: [{ type: "text", text: "kept", marks: [{ type: "sparkle" }] }] },
        ],
      },
    })
    expect(instance.editor.getText()).toBe("kept")
  })

  it("calls onChange with the document", () => {
    const onChange = vi.fn()
    const { editor } = mount({ onChange })
    editor.commands.insertContent("ސަލާމް")
    expect(onChange).toHaveBeenLastCalledWith(
      {
        type: "doc",
        content: [
          { type: "paragraph", attrs: { dir: null, textAlign: null }, content: [{ type: "text", text: "ސަލާމް" }] },
        ],
      },
      editor,
    )
  })

  it("renders the toolbar from the config", () => {
    const { host } = mount()
    const toolbar = host.querySelector('[role="toolbar"]')!
    expect(toolbar).toHaveAttribute("aria-label", "Formatting")
    expect(toolbar.querySelector('[data-action="bold"]')).toHaveAttribute("aria-pressed", "false")
    expect(toolbar.querySelector('[data-action="thaana"]')).not.toBeNull()
    expect(toolbar.querySelector("select")).toHaveAccessibleName("Block type")
  })

  it("only offers the profile's marks", () => {
    const config = defaultConfig()
    const { host, editor } = mount({
      config: { ...config, marks: config.marks.filter((mark) => mark.name === "bold") },
    })
    expect(host.querySelector('[data-action="italic"]')).toBeNull()
    expect(editor.schema.marks.italic).toBeUndefined()
    expect(editor.schema.marks.bold).toBeDefined()
  })

  it("toggles marks from the toolbar", () => {
    const { host, editor } = mount({
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "word" }] }] },
    })
    editor.commands.selectAll()
    host.querySelector<HTMLButtonElement>('[data-action="bold"]')!.click()
    expect(editor.isActive("bold")).toBe(true)
    expect(host.querySelector('[data-action="bold"]')).toHaveAttribute("aria-pressed", "true")
  })

  it("moves blocks with the keyboard and announces it", async () => {
    const { host, editor } = mount({
      content: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "one" }] },
          { type: "paragraph", content: [{ type: "text", text: "two" }] },
        ],
      },
    })
    editor.commands.setTextSelection(2)
    editor.commands.keyboardShortcut("Mod-Shift-ArrowDown")
    expect(editor.getText({ blockSeparator: "|" })).toBe("two|one")
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(host.querySelector('[aria-live="polite"]')).toHaveTextContent("Moved to position 2")
  })

  it("shows server errors on the block and clears them when it's edited", () => {
    const { host, editor, instance } = mount({
      content: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "a" }] },
          { type: "button", attrs: { text: "Go", url: "javascript:x" } },
        ],
      },
      errorPrefix: "body",
    })
    instance.setErrors({
      body: ["Block 2 (Button): Use an http(s) link."],
      "body.content.1.attrs.url": ["Use an http(s) link."],
    })
    expect(host.querySelector(".be-block-error")).toHaveTextContent("Use an http(s) link.")
    expect(host.querySelector('[data-block="button"]')).toHaveAttribute("aria-invalid", "true")

    const pos = editor.state.doc.child(0).nodeSize
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(pos, undefined, { ...editor.state.doc.child(1).attrs, url: "/ok" }),
    )
    expect(host.querySelector(".be-block-error")).toBeNull()
  })

  it("opens the settings panel of an atom and applies changes", () => {
    const { editor } = mount({
      content: { type: "doc", content: [{ type: "button", attrs: { text: "Go", url: "/a" } }] },
    })
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)))
    editor.commands.keyboardShortcut("Enter")

    const dialog = document.querySelector<HTMLElement>('.be-settings[role="dialog"]')!
    expect(dialog).toBeVisible()
    expect(dialog).toHaveAccessibleName("Button settings")
    const text = dialog.querySelector<HTMLInputElement>('input[name="text"]')!
    text.value = "ގިނައިން"
    text.dispatchEvent(new Event("input"))
    expect(editor.state.doc.child(0).attrs.text).toBe("ގިނައިން")

    const variant = dialog.querySelector<HTMLSelectElement>('select[name="variant"]')!
    expect([...variant.options].map((o) => o.value)).toEqual(["primary", "secondary", "outline"])
  })

  it("inserts blocks from the slash menu", async () => {
    const { editor } = mount()
    editor.commands.focus()
    editor.commands.insertContent("/head")
    await new Promise((resolve) => setTimeout(resolve, 0))
    const menu = document.querySelector<HTMLElement>(".be-slash")!
    expect(menu).toBeVisible()
    const options = [...menu.querySelectorAll('[role="option"]')].map((option) => option.textContent)
    expect(options[0]).toContain("Heading 1")
    editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: "heading", attrs: { level: 2 } })
    expect(editor.getText()).toBe("")
  })

  it("inserts columns with a paragraph in each and syncs them with the layout", async () => {
    const { editor, instance } = mount()
    const { insertItem } = await import("../../resources/js/editor/menu-items")
    insertItem(
      editor,
      { id: "columns", block: "columns", title: "Columns", icon: "columns", keywords: [], category: "layout" },
      () => undefined,
    )
    const columns = editor.getJSON().content![0]!
    expect(columns.type).toBe("columns")
    expect(columns.content).toHaveLength(2)

    const { syncColumns } = await import("../../resources/js/blocks/columns")
    editor.commands.insertContentAt(editor.state.doc.child(0).child(1).nodeSize + 3, "side")
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(0, undefined, { ...editor.state.doc.child(0).attrs, layout: "1-1-1" }),
    )
    syncColumns(editor, 0)
    expect(instance.getJSON().content[0]!.content).toHaveLength(3)

    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(0, undefined, { ...editor.state.doc.child(0).attrs, layout: "1-1" }),
    )
    syncColumns(editor, 0)
    expect(instance.getJSON().content[0]!.content).toHaveLength(2)
  })

  it("types Thaana when the toggle is on and marks the editor as Dhivehi", async () => {
    const { editor, host } = mount({ thaana: { default_on: false } })
    expect(editor.view.dom).not.toHaveAttribute("lang")
    host.querySelector<HTMLButtonElement>('[data-action="thaana"]')!.click()
    await Promise.resolve()
    expect(editor.storage.thaanaKeyboard.enabled).toBe(true)
    expect(editor.view.dom).toHaveAttribute("lang", "dv")
    expect(editor.view.dom).toHaveAttribute("dir", "rtl")

    editor.commands.setTextSelection(1)
    const handled = editor.view.someProp("handleTextInput", (f) =>
      f(editor.view, 1, 1, "s", () => editor.state.tr.insertText("s", 1, 1)),
    )
    expect(handled).toBe(true)
    expect(editor.getText()).toBe("ސ")
  })

  it("starts Thaana for the Dhivehi config and uses Dhivehi strings", () => {
    const { editor, host } = mount({ locale: "dv" })
    expect(editor.storage.thaanaKeyboard.enabled).toBe(true)
    expect(host.querySelector('[role="toolbar"]')).toHaveAttribute("aria-label", "ފޯމެޓިންގ")
  })

  it("can be read only", () => {
    const { editor, host, instance } = mount({ editable: false })
    expect(editor.isEditable).toBe(false)
    expect(host.querySelector('[role="toolbar"]')).not.toBeVisible()
    instance.setEditable(true)
    expect(editor.isEditable).toBe(true)
  })

  it("keeps the caret in text selections after moving", () => {
    const { editor } = mount({ content: { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] } })
    editor.commands.setTextSelection(1)
    editor.commands.keyboardShortcut("Mod-Shift-ArrowDown")
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
  })
})

describe("shortcuts", () => {
  it("aligns with logical start, center and end", () => {
    const { editor } = mount({
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }] },
    })
    editor.commands.setTextSelection(1)
    editor.commands.keyboardShortcut("Mod-Shift-e")
    expect(editor.getJSON().content![0]!.attrs!.textAlign).toBe("center")
    editor.commands.keyboardShortcut("Mod-Shift-r")
    expect(editor.getJSON().content![0]!.attrs!.textAlign).toBe("end")
    editor.commands.keyboardShortcut("Mod-Shift-l")
    expect(editor.getJSON().content![0]!.attrs!.textAlign).toBe("start")
  })
})
